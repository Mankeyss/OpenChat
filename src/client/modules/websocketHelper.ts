import {
  notification,
  error,
  success,
  promptPrefix,
  authToken,
} from "./run-prompt";
import IsJson from "./isJson";

import * as rl from "readline";

import { instance } from "./request";

import { PreviousMessageCallback } from "../../types/api";
import { EventType } from "../../types/event";
import { WsMessageType } from "../../types/websocket";

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
        console.log(event.data);
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
        }
      }
      process.stdout.write(promptPrefix.get());
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
