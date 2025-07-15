const commands = require("./commands.json");

import * as readline from "readline";
import Request, { instance } from "./request";
import GetClientVersion from "./getClientVersion";
import SaveClientConfig from "./saveClientConfig";
import RetrieveUserData from "./retrieveUserData";
import IsJson from "./isJson";

var clc = require("cli-color");

export const error = clc.red.bold;
export const success = clc.green;
export const notification = clc.blue;

let promptPrefix = ">";

export const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

let ws: WebSocket | undefined = undefined;

let authToken: string | undefined = undefined;

export default async function RunMessage(message: string) {
  const Loop = async () => {
    if (!message.startsWith(".")) {
      SendWS({ type: "text", message: message });
      return;
    } else {
      const command = message.slice(1).split(" ");

      const obj = commands.find(
        (x: any) => x["name"] === command[0] || x["alias"] === command[0]
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
            .then((res: any) => {
              if ("token" in res.data) {
                authToken = res.data.token;
                console.log(success("Successfully connected to " + command[1]));
              } else {
                console.log(error("No token received from server!"));
              }
            })
            .catch((err: any) => {
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
          promptPrefix = ">";
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
            .then((res: any) => {
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
          promptPrefix = ">";
          break;
        }
        case "dm": {
          DisconnectWs();
          ConnectWS(command[1], true);
          promptPrefix = command[1];
          break;
        }
        case "users": {
          SendWS({ type: "fetch", message: "users" });
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
              { username: username, password: password },
              "config/config.json"
            );
          else console.log(error("Password mismatch!"));
          break;
        }
      }
    }
  };
  await Loop();

  function Question(promptText: string): Promise<string> {
    return new Promise((resolve) => {
      process.stdout.write(promptText);

      rl.once("line", (line) => {
        RunMessage(line);
        resolve(line);
      });
    });
  }

  sleep(50, () => {
    Question(promptPrefix);
  });
}

const CustomQuestion = (question: string) => {
  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      resolve(answer);
    });
  });
};

const ConnectWS = (path: string, dm?: boolean) => {
  DisconnectWs();
  try {
    const url = new URL(instance.defaults.baseURL);
    ws = new WebSocket(
      "ws://" + url.host + (dm ? "/message/" : "/channel/") + path
    );
    ws.addEventListener("open", () => {
      console.log(
        success("Connected to " + "ws://" + url.host + "/channel/" + path)
      );
      promptPrefix = "#" + path + ">";
      sleep(200, () => {
        SendWS({ type: "auth", message: authToken });
      });
      return;
    });

    ws.addEventListener("message", (event: any) => {
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
      if (!IsJson(event.data)) {
        console.log(event.data);
      } else {
        const response = JSON.parse(event.data);
        if (response.callback) {
          if (response.callback === "previous-messages") {
            response.message.forEach((message: any) => {
              console.log(notification(message.author + ">" + message.message));
            });
          }
        } else if (response.type === "error") {
          console.log(error(response.message));
        }
      }
      process.stdout.write(promptPrefix);
    });

    ws.addEventListener("close", () => {
      promptPrefix = ">";
    });
  } catch (e: any) {
    if (e.code === "ERR_INVALID_URL") {
      console.log(error("Invalid URL address!"));
    } else {
      console.log(error("Error with WebSocket!"));
    }
  }
};

const SendWS = (message: any) => {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
  else if (!ws) console.log(error("You're not in a channel!"));
};

const DisconnectWs = () => {
  if (ws) ws.close();
};

function sleep(ms: number, callback: Function) {
  setTimeout(callback, ms);
}
