import { createHash } from "crypto";
import { getSupabaseAdminClient } from "@/lib/auth/supabase-admin";
import { logger } from "@/lib/logger";

interface CacheEntry {
  id: string;
  cacheKey: string;
  agentName: string;
  inputHash: string;
  output: Record<string, unknown>;
  tokensUsed: number;
  createdAt: string;
}

export class AiCacheService {
  private memoryCache = new Map<string, { data: Record<string, unknown>; expiresAt: number }>();
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Generate a cache key from agent name and input context.
   */
  generateKey(agentName: string, context: string, options?: Record<string, unknown>): string {
    const hash = createHash("sha256");
    hash.update(agentName);
    hash.update(context);
    if (options) {
      hash.update(JSON.stringify(options));
    }
    return hash.digest("hex");
  }

  /**
   * Try to get cached result.
   */
  async get(cacheKey: string): Promise<CacheEntry | null> {
    // Check memory cache first
    const memCached = this.memoryCache.get(cacheKey);
    if (memCached && Date.now() < memCached.expiresAt) {
      return {
        id: "memory",
        cacheKey,
        agentName: "",
        inputHash: cacheKey,
        output: memCached.data,
        tokensUsed: 0,
        createdAt: new Date().toISOString(),
      };
    }

    // Check database cache
    try {
      const supabase = getSupabaseAdminClient();
      const { data } = await supabase
        .from("ai_cache" as never)
        .select("*")
        .eq("cache_key", cacheKey)
        .gte("expires_at", new Date().toISOString())
        .single();

      if (data) {
        const entry = data as unknown as CacheEntry;
        // Populate memory cache
        this.memoryCache.set(cacheKey, {
          data: entry.output,
          expiresAt: Date.now() + this.CACHE_TTL_MS,
        });
        return entry;
      }
    } catch {
      // Cache miss or DB error - just return null
    }

    return null;
  }

  /**
   * Store AI result in cache.
   */
  async set(
    cacheKey: string,
    agentName: string,
    inputHash: string,
    output: Record<string, unknown>,
    tokensUsed: number
  ): Promise<void> {
    // Store in memory
    this.memoryCache.set(cacheKey, {
      data: output,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    });

    // Store in database
    try {
      const supabase = getSupabaseAdminClient();
      await supabase.from("ai_cache" as never).upsert({
        cache_key: cacheKey,
        agent_name: agentName,
        input_hash: inputHash,
        output: JSON.parse(JSON.stringify(output)),
        tokens_used: tokensUsed,
        expires_at: new Date(Date.now() + this.CACHE_TTL_MS).toISOString(),
      } as never);
    } catch (error) {
      logger.warn("Failed to cache AI result", { agentName, error: String(error) });
    }
  }

  /**
   * Invalidate cache entries for a given agent.
   */
  async invalidateByAgent(agentName: string): Promise<void> {
    // Clear memory cache
    for (const [key] of this.memoryCache) {
      // We don't store agent name in memory cache key, so just clear all
      this.memoryCache.delete(key);
    }

    // Clear database cache
    try {
      const supabase = getSupabaseAdminClient();
      await supabase
        .from("ai_cache" as never)
        .delete()
        .eq("agent_name", agentName);
    } catch (error) {
      logger.warn("Failed to invalidate AI cache", { agentName, error: String(error) });
    }
  }

  /**
   * Get cache statistics.
   */
  async getStats(): Promise<{ totalEntries: number; hitRate: number }> {
    let hitCount = 0;
    let totalCount = 0;

    try {
      const supabase = getSupabaseAdminClient();
      const { data } = await supabase
        .from("ai_cache" as never)
        .select("*");

      if (data) {
        totalCount = (data as unknown[]).length;
      }
    } catch {
      // DB might not be set up yet
    }

    return {
      totalEntries: totalCount,
      hitRate: totalCount > 0 ? hitCount / Math.max(totalCount, 1) : 0,
    };
  }
}

export const aiCacheService = new AiCacheService();
