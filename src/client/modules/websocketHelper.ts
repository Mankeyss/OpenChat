import {
  notification,
  error,
  success,
  promptPrefix,
  authToken,
} from "./run-prompt";

import { SetDM, DM, AddToDMHistory } from "./dm";

import IsJson from "./isJson";

import * as rl from "readline";

import { instance } from "./request";

import { PreviousMessageCallback } from "../../types/api";
import { EventType } from "../../types/event";
import { WsMessageType } from "../../types/websocket";
import { redrawLine } from "./readInput";

let ws: WebSocket | undefined = undefined;

export const ConnectWS = (path: string, dm?: boolean) => {
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
      promptPrefix.set("#" + path + ">");
      Sleep(200, () => {
        SendWS({ type: "auth", message: authToken as string });
      });
      return;
    });

    ws.addEventListener("message", (event: EventType) => {
      rl.clearLine(process.stdout, 0);
      rl.cursorTo(process.stdout, 0);
      if (!IsJson(event.data)) {
        if (DM === null) console.log(event.data);
      } else {
        const response = JSON.parse(event.data);
        if (response.callback) {
          if (response.callback === "previous-messages") {
            response.message.forEach((message: PreviousMessageCallback) => {
              console.log(notification(message.author + ">" + message.message));
            });
          } else if (response.callback === "users") {
            let i = 1;
            response.message.forEach((message: string) => {
              console.log(
                notification(i + ". " + JSON.parse(message).username)
              );
              i++;
            });
            if (response.message.length === 0)
              console.log(notification("You're alone in here :("));
          }
        } else if (response.type === "error") {
          console.log(error(response.message));
        } else if (response.type === "dm") {
          const message = response.sender + ">" + response.message;
          if (DM !== response.sender) {
            console.log(
              notification("You have a message from " + response.sender)
            );
          } else {
            console.log(message);
          }
          AddToDMHistory(response.sender, message);
        } else if (response.type === "dm-sent") {
          SetDM(response?.user);
          promptPrefix.set("dm#" + response?.user + ">");
        }
      }
      redrawLine();
    });

    ws.addEventListener("close", () => {
      promptPrefix.set(">");
    });
  } catch (e: any) {
    if (e.code === "ERR_INVALID_URL") {
      console.log(error("Invalid URL address!"));
    } else {
      console.log(error("Error with WebSocket!"));
    }
  }
};

export const SendWS = (message: WsMessageType) => {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
  else if (!ws) console.log(error("You're not in a channel!"));
};

export const DisconnectWs = () => {
  if (ws) ws.close();
};

export function Sleep(ms: number, callback: Function) {
  setTimeout(callback, ms);
}
