/**
 * Sensitive Data Redaction Service
 *
 * Automatically redacts secrets, keys, tokens, and credentials
 * before any content is sent to AI processing.
 */

const SECRET_PATTERNS: RegExp[] = [
  // API Keys and tokens
  /(api[_-]?key|apikey|api_secret|apiSecret)\s*[:=]\s*['"]?[A-Za-z0-9_\-\.]{16,}['"]?/gi,
  /(sk-[A-Za-z0-9]{32,})\b/g,                          // OpenAI keys
  /(ghp_[A-Za-z0-9]{36,})\b/g,                          // GitHub tokens
  /(gho_[A-Za-z0-9]{36,})\b/g,
  /(xox[pbar]-[A-Za-z0-9\-]{24,})\b/g,                 // Slack tokens
  /(AKIA[0-9A-Z]{16})\b/g,                              // AWS access keys
  /(eyJ[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,})/g, // JWTs

  // Connection strings
  /(postgresql?:\/\/)[^@\s]+@/g,                       // PostgreSQL URLs
  /(mysql:\/\/)[^@\s]+@/g,                              // MySQL URLs
  /(mongodb(?:\+srv)?:\/\/)[^@\s]+@/g,                 // MongoDB URLs
  /(redis:\/\/)[^@\s]+@/g,                              // Redis URLs

  // Environment variable assignments
  /(SECRET|SECRET_KEY|PRIVATE_KEY|PASSWORD|PASSWD|TOKEN|ACCESS_KEY)\s*[:=]\s*['"]?[A-Za-z0-9_\-\.\:\/]{8,}['"]?/gi,

  // Private keys
  /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,

  // Firebase config (common in web projects)
  /apiKey:\s*['"][A-Za-z0-9]{20,}['"]/g,
  /authDomain:\s*['"][A-Za-z0-9\-\.]{10,}['"]/g,
  /projectId:\s*['"][A-Za-z0-9\-]{5,}['"]/g,
  /storageBucket:\s*['"][A-Za-z0-9\-\.]{10,}['"]/g,
  /messagingSenderId:\s*['"][0-9]{10,}['"]/g,
  /appId:\s*['"][0-9:A-Za-z\-\.]{10,}['"]/g,
];

const REPLACEMENT = "[REDACTED]";

export class RedactionService {
  /**
   * Redact sensitive information from text content.
   */
  redactText(text: string): string {
    let result = text;
    for (const pattern of SECRET_PATTERNS) {
      result = result.replace(pattern, (match) => {
        // Keep the key/label portion visible but redact the value
        const separator = match.includes(":") ? ":" : match.includes("=") ? "=" : " ";
        if (separator !== " ") {
          const parts = match.split(separator);
          return `${parts[0]}${separator}${REPLACEMENT}`;
        }
        return REPLACEMENT;
      });
    }
    return result;
  }

  /**
   * Redact an entire file's content if it's a known secret file.
   */
  redactFile(filePath: string, content: string): string {
    const secretFiles = [
      ".env", ".env.local", ".env.production", ".env.development",
      ".env.staging", "credentials.json", "service-account.json",
      "firebase-admin.json", "service_account.json",
      ".npmrc", ".netrc", ".dockercfg", "docker-config.json",
    ];

    const fileName = filePath.split("/").pop() ?? "";

    // Redact entire secret files
    if (secretFiles.includes(fileName)) {
      return "[SECRET FILE REDACTED]";
    }

    // Redact sensitive patterns from other files
    return this.redactText(content);
  }

  /**
   * Check if a file should be excluded entirely from AI processing.
   */
  shouldExclude(filePath: string): boolean {
    const excludePatterns = [
      /\.env$/,
      /\.env\./,
      /credentials\.json$/,
      /service-account/,
      /\.secret/,
      /\.key$/,
      /\.pem$/,
      /\.cert$/,
      /node_modules/,
      /\.git/,
    ];
    return excludePatterns.some((p) => p.test(filePath));
  }
}

export const redactionService = new RedactionService();
