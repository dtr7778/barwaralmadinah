import { join } from "node:path";

import { sqliteGenerate } from "drizzle-dbml-generator";

import * as schema from "../schemas";

const DBML_OUTPUT_PATH = join(process.cwd(), "schema.dbml");

console.log("Generating dbml...");
sqliteGenerate({
  schema,
  out: DBML_OUTPUT_PATH,
  relational: true,
});
console.log("Done!");
