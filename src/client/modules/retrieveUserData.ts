import fs from "fs";

export default function RetrieveUserData(DataField: string): string | null {
  return JSON.parse(
    fs.readFileSync("./config/config.json", { encoding: "utf-8" })
  )[DataField.toLowerCase()];
}
