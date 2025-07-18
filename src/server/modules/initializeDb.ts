const fs = require("fs");

const sqlite = require("sqlite3");
import { open } from "sqlite";

import path from "path";

export default async function InitializeDb() {
  try {
    const folderPath = path.join(__dirname, "../", "config");
    const localPath = path.join(folderPath, "config.json");

    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);
    if (!fs.existsSync(localPath)) {
      fs.writeFileSync(
        localPath,
        `[
  {
    "channel_name": "test",
    "max_users": null,
    "auth_level": 0,
    "allowed_countries": [],
    "whitelist": false,
    "whitelistedIPs": []
      }
    ]`,
        {
          encoding: "utf-8",
        }
      );
    }

    const data = JSON.parse(fs.readFileSync(localPath, { encoding: "utf-8" }));

    const db = await open({
      filename: "./database.db",
      driver: sqlite.Database,
    });

    await db.exec(
      "CREATE TABLE IF NOT EXISTS channels (channel_name TEXT, max_users INT, auth_level INT, channel_id TEXT, allowed_countries TEXT, whitelist BOOL, whitelisted_ips TEXT)"
    );

    const allChannels: ({ channel_name: string } | undefined)[] = [];
    allChannels.push(await db.get("SELECT channel_name FROM channels"));

    data.map(
      async (channel: {
        channel_name: string;
        max_users: number | null;
        auth_level: number;
        allowed_countries: String[] | null;
        whitelist: boolean;
        whitelistedIPs: string[] | null;
      }) => {
        const index = allChannels.findIndex(
          (c) => c && c.channel_name === channel.channel_name
        );

        if (index !== -1) {
          allChannels.splice(index, 1);
        }

        const allowed_countries_formatted: string | null = Array.isArray(
          channel.allowed_countries
        )
          ? channel.allowed_countries.join(",")
          : null;

        const whitelisted_ips_formatted: string | null = Array.isArray(
          channel.whitelistedIPs
        )
          ? channel.whitelistedIPs.join(",")
          : null;

        if (
          (await db.get(
            "SELECT channel_name FROM channels WHERE channel_name = ?",
            [channel.channel_name]
          )) !== undefined
        ) {
          await db.run(
            "UPDATE channels SET max_users = :max_users, auth_level = :auth_level, allowed_countries = :allowed_countries, whitelist = :whitelist, whitelisted_ips = :whitelisted_ips WHERE channel_name = :channel_name",
            {
              ":channel_name": channel.channel_name,
              ":max_users": channel.max_users,
              ":auth_level": channel.auth_level,
              ":allowed_countries": allowed_countries_formatted,
              ":whitelist": channel.whitelist ? 1 : 0,
              ":whitelisted_ips": whitelisted_ips_formatted,
            }
          );

          return;
        }

        await db.run(
          "INSERT INTO channels (channel_name, max_users, auth_level, allowed_countries, whitelist, whitelisted_ips) VALUES(:channel_name, :max_users, :auth_level, :allowed_countries, :whitelist, :whitelisted_ips)",
          {
            ":channel_name": channel.channel_name,
            ":max_users": channel.max_users,
            ":auth_level": channel.auth_level,
            ":allowed_countries": allowed_countries_formatted,
            ":whitelist": channel.whitelist ? 1 : 0,
            ":whitelisted_ips": whitelisted_ips_formatted,
          }
        );
      }
    );

    allChannels.map(async (channel) => {
      if (channel) {
        await db.run("DELETE FROM channels WHERE channel_name = ?", [
          channel.channel_name,
        ]);
      }
    });
  } catch (e: any) {
    throw new Error(e);
  }
}
