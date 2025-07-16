import { CustomQuestion, error } from "./run-prompt";
import fs from "fs";
import path from "path";
import Encrypt from "./encryptPassword";
import { prompt } from "../main";

async function VerifyPassword() {
  try {
    const loop = async function () {
      const savedPassword = JSON.parse(
        fs.readFileSync(path.join(__dirname, "../", "config/config.json"), {
          encoding: "utf-8",
        })
      )?.password;
      if (!savedPassword) return true;
      const password = await CustomQuestion("Password: ");
      return (await Encrypt(password as string)) === savedPassword;
    };

    while (!(await loop())) {
      console.log(error("Incorrect password!"));
    }

    prompt(">");
  } catch (e: any) {
    throw new Error(e);
  }
}

export default VerifyPassword;
