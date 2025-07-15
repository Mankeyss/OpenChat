import fs from "fs";

export default function SaveClientConfig(
  data: {
    username: string;
    password?: string | undefined;
  },
  RelativePath: string
) {
  if (data.password?.length === 0) data.password = undefined;

  fs.writeFileSync(RelativePath, JSON.stringify(data));
}
