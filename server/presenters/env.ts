import { PublicEnv } from "@shared/types";

// Note: This entire object is stringified in the HTML exposed to the client
// do not add anything here that should be a secret or password
export default function present(env: Record<string, any>): PublicEnv {
  return {
    URL: env.URL.replace(/\/$/, ""),
    AWS_S3_UPLOAD_BUCKET_URL: env.AWS_S3_UPLOAD_BUCKET_URL,
    AWS_S3_ACCELERATE_URL: env.AWS_S3_ACCELERATE_URL,
    CDN_URL: (env.CDN_URL || "").replace(/\/$/, ""),
    COLLABORATION_URL: (env.COLLABORATION_URL || env.URL)
      .replace(/\/$/, "")
      .replace(/^http/, "ws"),
    DEPLOYMENT: env.DEPLOYMENT,
    ENVIRONMENT: env.NODE_ENV,
    SENTRY_DSN: env.SENTRY_DSN,
    TEAM_LOGO: env.TEAM_LOGO,
    SLACK_KEY: env.SLACK_KEY,
    SLACK_APP_ID: env.SLACK_APP_ID,
    MAXIMUM_IMPORT_SIZE: env.MAXIMUM_IMPORT_SIZE || 1024 * 1000 * 5,
    SUBDOMAINS_ENABLED: env.SUBDOMAINS_ENABLED === "true",
    EMAIL_ENABLED: !!env.SMTP_HOST || env.NODE_ENV === "development",
    GOOGLE_ANALYTICS_ID: env.GOOGLE_ANALYTICS_ID,
    RELEASE: env.SOURCE_COMMIT || env.SOURCE_VERSION || undefined,
  };
}
