const commands = require("./commands.json");

import * as readline from "readline";
import Request, { instance } from "./request";
import GetClientVersion from "./getClientVersion";
import SaveClientConfig from "./saveClientConfig";
import RetrieveUserData from "./retrieveUserData";

import { ConnectWS, DisconnectWs, SendWS, Sleep } from "./websocketHelper";

import prefix from "./promptPrefix";

import { ClientResponse, AuthResponse } from "../../types/api";

import Encrypt from "./encryptPassword";

var clc = require("cli-color");

export const error = clc.red.bold;
export const success = clc.green;
export const notification = clc.blue;

export let promptPrefix = new prefix("");

export const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

export let authToken: string | undefined = undefined;

export default async function RunMessage(message: string) {
  function Question(promptText: string): Promise<string> {
    return new Promise((resolve) => {
      process.stdout.write(promptText);

      rl.once("line", (line) => {
        RunMessage(line);
        resolve(line);
      });
    });
  }

  const Loop = async () => {
    if (!message.startsWith(".")) {
      SendWS({ type: "text", message: message });
      return;
    } else {
      const command = message.slice(1).split(" ");

      const obj = commands.find(
        (x: { name: string; alias?: string }) =>
          x["name"] === command[0] || x["alias"] === command[0]
      );

      if (!obj) {
        console.log(error("A command with that name was not found!"));
        return;
      }

      const { name, args } = obj;

      const allowedAmountOfArgs = args.toString().split(" || ");

      if (!allowedAmountOfArgs.includes((command.length - 1).toString())) {
        if (command.length - 1 < allowedAmountOfArgs[0])
          console.log(error("Missing arguments!"));
        else console.log(error("Too many arguments!"));

        console.log(
          error(
            "Usage: " +
              command[0] +
              " [argument]".repeat(allowedAmountOfArgs[0])
          )
        );
        return;
      }

      switch (name) {
        case "connect": {
          console.log("Attempting connection");
          await Request(
            "GET",
            command[1],
            { username: RetrieveUserData("username") },
            true
          )
            .then((res: ClientResponse<AuthResponse>) => {
              if ("token" in res.data) {
                authToken = res.data.token;
                console.log(success("Successfully connected to " + command[1]));
              } else {
                console.log(error("No token received from server!"));
              }
            })
            .catch(() => {
              console.log(
                error(
                  "There was an error connecting to " +
                    command[1] +
                    ", check your internet connection!"
                )
              );
            });
          break;
        }
        case "disconnect": {
          console.log(
            notification(`Disconnected from ${instance.defaults.baseURL}`)
          );
          DisconnectWs();
          instance.defaults.baseURL = undefined;
          promptPrefix.set(">");
          break;
        }
        case "help": {
          commands.map((command: { name: string; alias: string }) => {
            console.log(
              command.alias === undefined
                ? { name: command.name }
                : { name: command.name, alias: command.alias }
            );
          });
          break;
        }
        case "previous": {
          SendWS({
            type: "fetch",
            message: "previous-messages",
            min: command[1],
            max: command[2],
          });
          break;
        }
        case "clear": {
          console.clear();
          break;
        }
        case "list": {
          Request("GET", "/channels")
            .then((res: ClientResponse) => {
              readline.clearLine(process.stdout, 0);
              readline.cursorTo(process.stdout, 0);
              console.log(res.data);
            })
            .catch(() => {
              console.log(error("Error retrieving channels!"));
            });
          break;
        }
        case "goto": {
          ConnectWS(command[1]);
          break;
        }
        case "exit": {
          process.exit();
          break;
        }
        case "leave": {
          DisconnectWs();
          promptPrefix.set(">");
          break;
        }
        case "dm": {
          DisconnectWs();
          ConnectWS(command[1], true);
          promptPrefix.set(command[1]);
          break;
        }
        case "users": {
          SendWS({ type: "fetch", message: "users" });
          throw "exit";
          break;
        }
        case "version": {
          console.log(
            `Running OpenChat Version ${notification(
              await GetClientVersion("./package.json")
            )}`
          );
          break;
        }
        case "setup": {
          const username = (await CustomQuestion("Username: ")) as string;
          const password = (await CustomQuestion(
            "Password (leave empty if none): "
          )) as string;

          if (
            password.length === 0 ||
            password ===
              ((await CustomQuestion("Confirm Password: ")) as string)
          )
            SaveClientConfig(
              { username: username, password: await Encrypt(password) },
              "config/config.json"
            );
          else console.log(error("Password mismatch!"));
          break;
        }
      }
    }
  };
  try {
    await Loop();

    Sleep(50, () => {
      Question(promptPrefix.get());
    });
  } catch {
    Question(promptPrefix.get());
  }
}

const CustomQuestion = (question: string) => {
  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      resolve(answer);
    });
  });
};
