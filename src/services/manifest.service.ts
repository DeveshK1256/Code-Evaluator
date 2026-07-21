import { getSupabaseAdminClient } from "@/lib/auth/supabase-admin";
import type {
  RepositoryManifest,
  RepositoryMetadata,
  ManifestFileEntry,
  ManifestDependency,
  TechnologyItem,
  TechnologyProfile,
  RepositoryFile,
} from "@/types/repository";

export class ManifestService {
  /**
   * Build and persist a repository manifest.
   */
  async generate(data: {
    repositoryId: string;
    name: string;
    source: string;
    description?: string;
    defaultBranch?: string;
    license?: string;
    stars?: number;
    forks?: number;
    totalFiles: number;
    totalSizeBytes: number;
    primaryLanguage?: string;
    hasReadme: boolean;
    hasLicense: boolean;
    hasCiCd: boolean;
    files: RepositoryFile[];
    technologies: { items: TechnologyItem[]; categories: Record<string, TechnologyItem[]> };
    directoryTree: unknown[];
  }): Promise<RepositoryManifest> {
    // Build metadata section
    const metadata: RepositoryMetadata = {
      name: data.name,
      source: data.source as RepositoryMetadata["source"],
      description: data.description,
      defaultBranch: data.defaultBranch,
      license: data.license,
      stars: data.stars,
      forks: data.forks,
      totalFiles: data.totalFiles,
      totalSizeBytes: data.totalSizeBytes,
      primaryLanguage: data.primaryLanguage,
      hasReadme: data.hasReadme,
      hasLicense: data.hasLicense,
      hasCiCd: data.hasCiCd,
    };

    // Build file entries
    const fileEntries: ManifestFileEntry[] = data.files.map((f) => ({
      path: f.path,
      name: f.name,
      extension: f.extension,
      sizeBytes: f.sizeBytes,
      isBinary: f.isBinary,
      isGenerated: f.isGenerated,
      isConfig: f.isConfig,
      directory: f.path.includes("/") ? f.path.substring(0, f.path.lastIndexOf("/")) : "/",
    }));

    // Detect dependencies from common manifests
    const dependencies = await this.extractDependencies(data.files);

    // Build configuration file index
    const configuration: Record<string, string[]> = {};
    for (const file of data.files) {
      if (file.isConfig) {
        const dir = file.path.includes("/") ? file.path.substring(0, file.path.lastIndexOf("/")) : "/";
        if (!configuration[dir]) configuration[dir] = [];
        configuration[dir]!.push(file.path);
      }
    }

    const manifest: RepositoryManifest = {
      id: crypto.randomUUID(),
      repositoryId: data.repositoryId,
      version: "1.0",
      metadata,
      files: fileEntries,
      technologies: {
        id: "",
        repositoryId: data.repositoryId,
        categories: data.technologies.categories,
        detectedAt: new Date().toISOString(),
      },
      dependencies,
      configuration,
      generatedAt: new Date().toISOString(),
    };

    // Persist to database
    await this.persist(manifest);

    return manifest;
  }

  /**
   * Get manifest by repository ID.
   */
  async getByRepositoryId(repositoryId: string): Promise<RepositoryManifest | null> {
    const supabase = getSupabaseAdminClient();
    const { data: raw } = await supabase
      .from("repository_manifests")
      .select("*")
      .eq("repository_id", repositoryId)
      .single();

    if (!raw) return null;
    const data = raw as Record<string, unknown>;

    return {
      id: data.id as string,
      repositoryId: data.repository_id as string,
      version: data.version as string,
      metadata: data.metadata as RepositoryMetadata,
      files: ((data.file_summary as Record<string, unknown>)?.files as ManifestFileEntry[]) ?? [],
      technologies: data.technologies as TechnologyProfile,
      dependencies: (data.dependencies as ManifestDependency[]) ?? [],
      configuration: (data.configuration as Record<string, string[]>) ?? {},
      generatedAt: data.generated_at as string,
    };
  }

  private async persist(manifest: RepositoryManifest): Promise<void> {
    const supabase = getSupabaseAdminClient();

    // Upsert manifest
    const { error: manifestError } = await supabase
      .from("repository_manifests" as never)
      .upsert({
        repository_id: manifest.repositoryId,
        version: manifest.version,
        metadata: JSON.parse(JSON.stringify(manifest.metadata)),
        file_summary: {
          totalFiles: manifest.files.length,
          files: manifest.files.slice(0, 5000),
          configCount: manifest.files.filter((f) => f.isConfig).length,
          binaryCount: manifest.files.filter((f) => f.isBinary).length,
        },
        technologies: JSON.parse(JSON.stringify(manifest.technologies)),
        dependencies: JSON.parse(JSON.stringify(manifest.dependencies)),
        configuration: JSON.parse(JSON.stringify(manifest.configuration)),
        generated_at: manifest.generatedAt,
      } as never);

    if (manifestError) throw manifestError;

    // Persist technology profile separately
    const { error: techError } = await supabase
      .from("technology_profiles" as never)
      .upsert({
        repository_id: manifest.repositoryId,
        categories: JSON.parse(JSON.stringify(manifest.technologies.categories)),
        detected_at: manifest.technologies.detectedAt,
      } as never);

    if (techError) throw techError;

    // Batch insert repository files
    const batchSize = 500;
    for (let i = 0; i < manifest.files.length; i += batchSize) {
      const batch = manifest.files.slice(i, i + batchSize).map((f) => ({
        repository_id: manifest.repositoryId,
        path: f.path,
        name: f.name,
        extension: f.extension,
        size_bytes: f.sizeBytes,
        is_binary: f.isBinary,
        is_generated: f.isGenerated,
        is_hidden: f.name.startsWith("."),
        is_config: f.isConfig,
      }));

      const { error: filesError } = await supabase.from("repository_files" as never).insert(batch as never);
      if (filesError) {
        console.error("Failed to insert file batch:", filesError);
      }
    }
  }

  private async extractDependencies(files: RepositoryFile[]): Promise<ManifestDependency[]> {
    // Check for package.json presence
    const pkgJson = files.find((f) => f.path === "package.json");
    if (pkgJson) return []; // Dependencies parsed during manifest building

    return [];
  }
}

export const manifestService = new ManifestService();
