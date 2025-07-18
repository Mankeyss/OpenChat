import axios from "axios";
import fs from "fs";
import { VersionResponse } from "../../types/api";

import path from "path";

export default async function GetClientVersion() {
  const currentVersion = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../", "package.json"), {
      encoding: "utf-8",
    })
  ).version;

  try {
    const latestVersion: VersionResponse = (
      await axios.get(
        "https://raw.githubusercontent.com/Mankeyss/OpenChat/refs/heads/main/src/server/package.json"
      )
    ).data.version;

    return (
      currentVersion +
      (latestVersion !== currentVersion ? ` (${latestVersion} available)` : "")
    );
  } catch {
    return currentVersion + " (couldn't fetch latest version!)";
  }
}
