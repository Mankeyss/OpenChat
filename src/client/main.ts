#!/usr/bin/env node

import * as readline from "readline";
import RunMessage, { notification } from "./modules/run-prompt";
import VerifyPassword from "./modules/verifyPassword";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

export const prompt = (question: string) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      RunMessage(answer);
      resolve(answer);
    });
  });
};

console.log("Welcome to OpenChat!\nStart by typing " + notification(".help"));

VerifyPassword();
