const express = require("express");
const app = express();
const expressWS = require("express-ws")(app);
require("dotenv").config();

const axios = require("axios");

const port = process.env.PORT;

const privateKey = process.env.PRIVATE_KEY;

const jwt = require("jsonwebtoken");

import InitializeDb from "./modules/initializeDb";

app.use(express.json());

InitializeDb("./config/config.json");

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

import {
  ServerResponse,
  ServerRequest,
  UserData,
  WebSocketRequest,
  WebSocket,
  PreviousMessageCallback,
  ClientResponse,
  CountryFetch,
} from "../types/api";

import UseSql from "./modules/useSql";

app.get("/", (req: ServerRequest<UserData>, res: ServerResponse) => {
  const { username } = req.query || {};
  if (!username) {
    res.sendStatus(400);
    return;
  }

  const token = jwt.sign({ username: username }, privateKey, {
    algorithm: "RS256",
    expiresIn: "1h",
  });

  res.status(200).send({ token: token });
});

app.get("/channels", async (req: ServerRequest, res: ServerResponse) => {
  try {
    const response = await UseSql(
      "all",
      "SELECT channel_name FROM channels",
      []
    );

    if (response === undefined) {
      res.sendStatus(500);
    } else {
      res.status(200).send(response);
    }
  } catch {
    res.status(500);
  }
});

const channels = new Map<string, Set<WebSocket>>();
const messages = new Map<string, Array<PreviousMessageCallback>>();

const usernames = new Map<WebSocket, string>();

app.ws("/channel/:id", async (ws: WebSocket, req: WebSocketRequest) => {
  const { id } = req.params || {};
  if (!id) ws.close();

  const response = await UseSql(
    "get",
    "SELECT channel_name FROM channels WHERE channel_name = ?",
    [id]
  );

  if (response === undefined) {
    ws.send("Channel " + id + " does not exist!");
    ws.close();
    return;
  }

  const ip = req.socket.remoteAddress;
  await axios
    .get("https://reallyfreegeoip.org/json/" + ip)
    .then((response: ClientResponse<CountryFetch>) =>
      console.log(
        "Established connection with " + ip + ` (${response.data.country_name})`
      )
    );

  ws.on("message", (msg: string) => {
    const data = JSON.parse(msg);

    if (data.type === "text") {
      if (!messages.has(id)) {
        messages.set(id, []);
      }
      messages
        .get(id)!
        .push({ author: usernames?.get(ws), message: data.message });

      try {
        for (const client of Array.from(channels.get(id)!)) {
          if (client.readyState === WebSocket.OPEN && client !== ws) {
            client.send(usernames?.get(ws) + ">" + data.message);
          }
        }
      } catch {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Could not send message to all users!",
          })
        );
      }
    } else if (data.type === "auth") {
      try {
        const { username } = jwt.verify(data.message, privateKey);
        usernames.set(ws, username);
        if (!channels.has(id)) {
          channels.set(id, new Set());
        }
        channels.get(id)!.add(ws);
      } catch {
        ws.send("Error authenticating, disconnecting!");
        ws.close();
      }
    } else if (data.type === "fetch") {
      try {
        if (data.message === "users") {
          const users: string[] = [];
          usernames.forEach((value: string, key: WebSocket) => {
            if (channels.get(id)?.has(key))
              users.push(JSON.stringify({ username: value }));
          });
          ws.send(
            JSON.stringify({
              type: "fetch-success",
              message: users,
              callback: data.message,
            })
          );
        } else if (data.message === "previous-messages") {
          if (data.max && data.min) {
            const limitedMessages = messages.get(id);
            ws.send(
              JSON.stringify({
                type: "fetch-success",
                message: limitedMessages?.slice(data.min, data.max),
                callback: data.message,
              })
            );
          } else if (data.min) {
            const limitedMessages = messages.get(id);
            ws.send(
              JSON.stringify({
                type: "fetch-success",
                message: limitedMessages?.slice(-data.min),
                callback: data.message,
              })
            );
          } else {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Missing params!",
              })
            );
          }
        } else {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Unknown request!",
            })
          );
        }
      } catch {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Could not fetch the data!",
          })
        );
      }
    }
  });

  ws.on("close", () => {
    channels.get(id)?.delete(ws);
    if (channels.get(id)?.size === 0) {
      channels.delete(id);
      messages.delete(id);
    }

    usernames.delete(ws);
  });
});
