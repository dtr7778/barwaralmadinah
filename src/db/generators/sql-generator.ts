import { exec } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";

const execAsync = promisify(exec);

const SQL_OUTPUT_PATH = join(process.cwd(), "full-schema.sql");

async function exportDrizzleSQL(): Promise<void> {
  try {
    console.log("📦 Running drizzle-kit export...");
    // Run the drizzle-kit export command
    const { stdout, stderr } = await execAsync(
      'pnpm drizzle-kit export --sql --config="./drizzle.config.ts"'
    );

    if (stderr && !stderr.includes("warn")) {
      console.error("⚠️  Warning/Error output:", stderr);
    }

    // Check if we got SQL output
    if (!stdout || stdout.trim() === "") {
      throw new Error("No SQL output received from drizzle-kit export");
    }

    // Ensure the output directory exists
    const outputDir = dirname(SQL_OUTPUT_PATH);

    await mkdir(outputDir, { recursive: true });

    // Write the SQL to file
    await writeFile(SQL_OUTPUT_PATH, stdout, "utf-8");

    console.log(`✅ SQL exported successfully to: ${SQL_OUTPUT_PATH}`);
    console.log(`📄 File size: ${(stdout.length / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error("❌ Failed to export SQL:", error);
    throw error;
  }
}

// Main execution
async function main() {
  await exportDrizzleSQL();
}

// Run the script
main().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
