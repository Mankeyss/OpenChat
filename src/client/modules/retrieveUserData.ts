import fs from "fs";
import path from "path";

export default function RetrieveUserData(DataField: string): string | null {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, "../", "config/config.json"), {
      encoding: "utf-8",
    })
  )[DataField.toLowerCase()];
}
