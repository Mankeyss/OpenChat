import * as readline from "readline";
import RunMessage, { notification } from "./modules/run-prompt";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

const prompt = (question: string) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      RunMessage(answer);
      resolve(answer);
    });
  });
};

console.log("Welcome to OpenChat!\nStart by typing " + notification(".help"));
prompt(">");
