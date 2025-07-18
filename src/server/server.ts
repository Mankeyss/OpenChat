#!/usr/bin/env node
const express = require("express");
const app = express();
const expressWS = require("express-ws")(app);
require("dotenv").config();

const axios = require("axios");

const privateKey = process.env.PRIVATE_KEY;

const jwt = require("jsonwebtoken");

import InitializeDb from "./modules/initializeDb";

app.use(express.json());

var clc = require("cli-color");

export const error = clc.red.bold;
export const success = clc.green;
export const notification = clc.blue;

import GetServerVersion from "./modules/getServerVersion";

InitializeDb();

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

const LogServerVersion = async () => {
  console.log(
    "Server running version " + notification(await GetServerVersion())
  );
};

LogServerVersion();

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

import UseSql, { getChannelProperty } from "./modules/useSql";

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
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Channel " + id + " does not exist!",
      })
    );
    ws.close();
    return;
  }

  const ip = req.socket.remoteAddress;
  try {
    if (Number(await getChannelProperty(id, "whitelist")) === 1) {
      const whitelisted_ips = (
        await getChannelProperty(id, "whitelisted_ips")
      ).split(",");

      if (!whitelisted_ips.includes(ip)) {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Channel does not accept users from this IP!",
          })
        );
        ws.close();
        console.log(
          error(
            "Denied user because they have an unknown IP (you can update this in config.json)"
          )
        );
      }
    }
  } catch {}

  await axios
    .get("https://reallyfreegeoip.org/json/" + ip)
    .then(async (response: ClientResponse<CountryFetch>) => {
      const country = response.data.country_name;
      //If channel does not allow users from user country, give error
      const allowed_countries = (
        await getChannelProperty(id, "allowed_countries")
      )
        .toLowerCase()
        .split(",");

      if (
        !allowed_countries.includes(country.toLowerCase()) &&
        !(allowed_countries.includes("local") && country === "") &&
        allowed_countries.length > 0
      ) {
        ws.send(
          JSON.stringify({
            type: "error",
            message:
              "Channel does not accept users from " +
              (country === "" ? "Local" : country) +
              "!",
          })
        );
        ws.close();
        console.log(
          error(
            "Denied user because they are from foreign country (you can update this in config.json)"
          )
        );
      }
      if (ws && ws.readyState !== 2 && ws.readyState !== 3)
        console.log(
          success("Established connection with " + ip + ` (${country})`)
        );
    });

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
    } else if (data.type === "dm") {
      if (!data.user)
        return ws.send(
          JSON.stringify({ type: "error", message: "Missing user parameter!" })
        );

      const getUser = () => {
        for (const [key, value] of usernames) {
          if (value === data.user) return key;
        }
      };

      const user = getUser();

      if (!user)
        return ws.send(
          JSON.stringify({ type: "error", message: "Couldn't find user!" })
        );

      if (data.user === usernames.get(ws))
        return ws.send(
          JSON.stringify({ type: "error", message: "Unable to DM yourself!" })
        );

      if (data.message) {
        user.send(
          JSON.stringify({
            type: "dm",
            message: data.message,
            sender: usernames.get(ws),
          })
        );
      }
      ws.send(JSON.stringify({ type: "dm-sent", user: data.user }));
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
