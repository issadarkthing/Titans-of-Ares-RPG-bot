import { Database, verbose } from "sqlite3";
import { CommandManager } from "./Command";
import Discord, { TextChannel } from "discord.js";
import { schema } from "../db/schema";
import { Phase } from "./TeamArena";

export default class Client {
  prefix = process.env.PREFIX!;
  oldBotID = process.env.OLD_BOT_ID!;
  rankChannelID = process.env.RANK_CHANNEL!;
  xpLogChannelID = process.env.XP_LOG_CHANNEL!;
  teamArenaChannelID = process.env.TEAM_ARENA_CHANNEL!;
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
  logChannel!: TextChannel;
  teamArenaChannel!: TextChannel;
  /** variable to only be changed in dev environment for testing purposes.
   * For production, please avoid using this to update the team arena phase and
   * use poll event instead */
  arenaPhase?: Phase;

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

  startPollEvent() {
    setInterval(() => {
      this.pollHandlers.forEach(fn => fn());
    }, 1000)
  }

  start() {
    // create necessary tables if not exist
    this.db.exec(schema);
    this.bot.login(process.env.BOT_TOKEN);
  }
}
