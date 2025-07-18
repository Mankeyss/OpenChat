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

export async function getChannelProperty(
  channelName: string,
  property: string
): Promise<string> {
  const db = await open({
    filename: "./database.db",
    driver: sqlite.Database,
  });

  return await db
    .get(
      `SELECT ${property} FROM channels WHERE channel_name = "${channelName}"`
    )
    .then((response) => {
      return response[property];
    })
    .catch(() => {
      return null;
    });
}
