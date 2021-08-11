import { Database, verbose } from "sqlite3";
import { CommandManager } from "./Command";
import Discord, { TextChannel } from "discord.js";
import { schema } from "../db/schema";
import { Phase } from "./TeamArena";

export default class Client {
  readonly prefix = process.env.PREFIX!;
  readonly oldBotID = process.env.OLD_BOT_ID!;
  readonly rankChannelID = process.env.RANK_CHANNEL!;
  readonly xpLogChannelID = process.env.XP_LOG_CHANNEL!;
  readonly teamArenaChannelID = process.env.TEAM_ARENA_CHANNEL!;
  readonly dbPath = process.env.DB!;
  readonly serverID = process.env.SERVER_ID!;
  readonly devID = process.env.DEV_ID!;
  readonly isDev = process.env.ENV === "DEV";
  readonly commandManager = new CommandManager();
  readonly onMultiUpgrade = new Set<string>();
  readonly bot = new Discord.Client();
  db: Database;
  logChannel!: TextChannel;
  teamArenaChannel!: TextChannel;
  /** functions to be run every 1 seconds interval */
  pollHandlers: (() => void)[] = [];
  /** stores discord id of user that triggers the xp log */
  xpLogTriggers = "";
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
