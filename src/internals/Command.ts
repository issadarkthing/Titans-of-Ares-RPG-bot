import { Message } from "discord.js";
import fs from "fs";
import util from "util";
import path from "path";
import chalk from "chalk";
import { oneLine } from "common-tags";

export default abstract class Command {
  abstract name: string;
  aliases: string[] = [];
  /** blocks command if there's already an instance of it running under the same
   * player*/
  block = false;

  abstract exec(msg: Message, args: string[]): unknown | Promise<unknown>;
}

interface CommandLog {
  name: string;
  aliases: string[];
  timeTaken: number;
}

const readdir = util.promisify(fs.readdir);

export class CommandManager {
  private commands = new Map<string, Command>();
  private blockList = new Set<string>();
  private commandRegisterLog: CommandLog[] = [];
  verbose = false;

  async registerCommands(dir: string) {
    this.verbose && 
      console.log(`=== ${chalk.blue("Registering command(s)")} ===`)

    const files = await readdir(dir);
    const initial = performance.now();
    for (const file of files) {
      const initial = performance.now();
      const filePath = path.join(dir, file);
      // eslint-disable-next-line
      const cmdFile = require(filePath);
      const command: Command = new cmdFile.default();
      const now = performance.now();
      const timeTaken = now - initial;

      this.commandRegisterLog.push({
        name: command.name,
        aliases: command.aliases,
        timeTaken,
      })

      this.commands.set(command.name, command);
      command.aliases.forEach(alias => this.commands.set(alias, command));
    }
    const now = performance.now();
    const timeTaken = (now - initial).toFixed(4);

    if (this.verbose) {
      this.commandRegisterLog.sort((a, b) => b.timeTaken - a.timeTaken);

      for (const log of this.commandRegisterLog) {
        const timeTaken = log.timeTaken.toFixed(4);
        const aliases = log.aliases.join(", ");
        console.log(
          `${chalk.yellow(`[${timeTaken} ms]`)} ${log.name}\t\t${aliases}`
        );
      }

      const commandCount = this.commandRegisterLog.length;
      console.log(
        oneLine`Loading ${chalk.green(commandCount)} command(s) took
        ${chalk.yellow(timeTaken, "ms")}`
      );
    }
  }

  async handleMessage(cmd: string, msg: Message, args: string[]) {
    const command = this.commands.get(cmd);
    if (!command)
      return;

    if (command.block) {
      const id = `${command.name}_${msg.author.id}`;
      if (this.blockList.has(id)) {
        msg.channel.send(
          `There's already an instance of ${command.name} command running`
        );
      } else {
        this.blockList.add(id);
        await command.exec(msg, args);
        this.blockList.delete(id);
      }
      return;
    }

    command.exec(msg, args);
  }
}
