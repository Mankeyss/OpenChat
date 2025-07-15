import axios from "axios";
import fs from "fs";

export default async function GetClientVersion(RelativePath: string) {
  const currentVersion = JSON.parse(
    fs.readFileSync(RelativePath, { encoding: "utf-8" })
  ).version;

  try {
    const latestVersion: any = (
      await axios.get(
        "https://raw.githubusercontent.com/Mankeyss/OpenChat/refs/heads/main/src/client/package.json"
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
