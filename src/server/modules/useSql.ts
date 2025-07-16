const sqlite = require("sqlite3");
import { open } from "sqlite";
export default async function (
  method: "all" | "get" | "each",
  code: string,
  placeholders?: string[]
) {
  const db = await open({
    filename: "./database.db",
    driver: sqlite.Database,
  });

  return await db[method](code, placeholders);
}
