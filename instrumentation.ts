export async function register() {
  console.log("Instrumentation: Registering");
  try {
    const db = await import("./src/lib/db");
    await db.ensureInitialized();
  } catch (error) {
    console.error("Instrumentation: Failed to initialize database:", error);
    // For Edge Runtime compatibility, we'll throw an error instead of using process.exit
    if (process.env.NODE_ENV === "production") {
      console.error("Instrumentation: Critical initialization failure");
      throw new Error("Critical database initialization failure");
    }
  } finally {
    console.log("Instrumentation: Registration complete");
  }
}
