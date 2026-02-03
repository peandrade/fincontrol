/**
 * Next.js instrumentation file.
 * Runs once when the server starts.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initEnv } = await import("@/lib/env");

    try {
      const env = initEnv();
      console.log(`✓ Environment validated (${env.isProduction ? "production" : "development"})`);
    } catch (error) {
      console.error("✗ Environment validation failed:");
      console.error(error);
      process.exit(1);
    }
  }
}
