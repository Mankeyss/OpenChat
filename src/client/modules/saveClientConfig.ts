import fs from "fs";
import path from "path";

export default function SaveClientConfig(
  data: {
    username: string;
    password?: string | undefined;
  },
  relativePath: string
) {
  if (data.password?.length === 0) data.password = undefined;

  fs.writeFileSync(
    path.join(__dirname, "../", relativePath),
    JSON.stringify(data)
  );
}
