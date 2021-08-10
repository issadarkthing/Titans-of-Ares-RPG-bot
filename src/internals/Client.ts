import { Database, verbose } from "sqlite3";
import { CommandManager } from "./Command";
import Discord from "discord.js";
import { schema } from "../db/schema";

export default class Client {
  prefix = process.env.PREFIX!;
  oldBotID = process.env.OLD_BOT_ID!;
  rankChannelID = process.env.RANK_CHANNEL!;
  xpLogChannelID = process.env.XP_LOG_CHANNEL!;
  dbPath = process.env.DB!;
  serverID = process.env.SERVER_ID!;
  devID = process.env.DEV_ID!;
  isDev = process.env.ENV === "DEV";
  commandManager = new CommandManager();
  onMultiUpgrade = new Set<string>();
  bot = new Discord.Client();
  /** functions to be run every 1 seconds interval */
  pollHandlers: (() => void)[] = [];
  /** stores discord id of user that triggers the xp log */
  xpLogTriggers = "";
  db: Database;

  constructor(dbPath: string) {
    const sqlite3 = verbose();
    this.db = new sqlite3.Database(dbPath);
  }

  registerCommands(cmdPath: string) {
    const initial = performance.now();
    this.commandManager
      .registerCommands(cmdPath)
      .then(() => {
        const timeTaken = performance.now() - initial;
        console.log(`Registering commands took ${timeTaken.toFixed(4)} ms`);
      })
  }

  addPollHandler(fn: () => void) {
    this.pollHandlers.push(fn);
  }

  start() {
    // create necessary tables if not exist
    this.db.exec(schema);
    this.bot.login(process.env.BOT_TOKEN);

    setInterval(() => {
      this.pollHandlers.forEach(fn => fn());
    }, 1000)
  }
}
