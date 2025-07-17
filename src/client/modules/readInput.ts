import * as readline from "readline";
import { promptPrefix } from "./run-prompt";

readline.emitKeypressEvents(process.stdin);

if (process.stdin.isTTY) process.stdin.setRawMode(true);

export let buffer: string = "";

let historyIdx: number = -1;
let history: string[] = [];

export function redrawLine(index?: number) {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  if (index) process.stdout.write(promptPrefix.get() + history[historyIdx]);
  else process.stdout.write(promptPrefix.get() + buffer);
}

export default function ReadInput() {
  process.stdin.on("keypress", (chunk, key) => {
    if (key && chunk) {
      if (key.ctrl && key.name == "c") process.exit();

      if (key.name === "backspace") {
        buffer = buffer.slice(0, -1);
        redrawLine();
        return;
      } else if (key.name === "return") {
        if (history.length === 0 || history[0] !== buffer)
          history.unshift(buffer);
        historyIdx = -1;
        buffer = "";
        return;
      } else {
        buffer += chunk;
        process.stdout.write(chunk);
      }
    } else if (key && history.length > 0) {
      if (key.name === "up" || key.name === "down") {
        if (key.name === "up") {
          if (historyIdx < history.length - 1) historyIdx++;
        } else if (key.name === "down") {
          if (historyIdx >= 1) historyIdx--;
        }
        buffer = history[historyIdx];
        redrawLine(historyIdx);
      }
    }
  });
}
