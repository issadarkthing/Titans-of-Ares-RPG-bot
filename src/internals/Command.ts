import { Message } from "discord.js";
import fs from "fs";
import util from "util";
import path from "path";

export default abstract class Command {
  abstract name: string;
  aliases: string[] = [];

  abstract exec(msg: Message, args: string[]): unknown | Promise<unknown>;
}

const readdir = util.promisify(fs.readdir);

export class CommandManager {
  private commands = new Map<string, Command>();

  async registerCommands(dir: string) {
    const files = await readdir(dir);
    for (const file of files) {
      // eslint-disable-next-line
      const cmdFile = require(path.join(dir, file));
      const command: Command = new cmdFile.default();
      this.commands.set(command.name, command);
      command.aliases.forEach(alias => this.commands.set(alias, command));
    }
  }

  handleMessage(cmd: string, msg: Message, args: string[]) {
    
    const command = this.commands.get(cmd);

    if (!command)
      return;

    command.exec(msg, args);
  }
}
