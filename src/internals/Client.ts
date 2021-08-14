import { Database, verbose } from "sqlite3";
import { CommandManager } from "./Command";
import Discord, { TextChannel } from "discord.js";
import { schema } from "../db/schema";
import { Phase } from "./TeamArena";

type PollHandler = () => void;
type BlockingPollHandler = () => Promise<void>;

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
  readonly blockingPoll = new Set<BlockingPollHandler>();
  readonly bot = new Discord.Client();
  db: Database;
  logChannel!: TextChannel;
  teamArenaChannel!: TextChannel;
  /** functions to be run every 1 seconds interval */
  pollHandlers: PollHandler[] = [];
  blockingPollHandlers: BlockingPollHandler[] = [];
  /** stores discord id of user that triggers the xp log */
  xpLogTriggers = "";
  /** variable to only be changed in dev environment for testing purposes.
   * For production, please avoid using this to update the team arena phase and
   * use poll event instead */
  arenaPhase = Phase.SIGNUP_1;

  constructor(dbPath: string) {
    const sqlite3 = verbose();
    this.db = new sqlite3.Database(dbPath);
  }

  addPollHandler(fn: PollHandler) {
    this.pollHandlers.push(fn);
  }
  addBlockingPollHandler(fn: BlockingPollHandler) {
    this.blockingPollHandlers.push(fn);
  }

  startPollEvent() {
    setInterval(() => {
      // runs all normal poll without having to wait if previous poll handler
      // finished
      this.pollHandlers.forEach(fn => fn());

      // does not run poll handlers which have not finished running yet
      this.blockingPollHandlers.forEach(fn => {
        if (this.blockingPoll.has(fn)) {
          return;
        }

        this.blockingPoll.add(fn);
        fn().then(() => this.blockingPoll.delete(fn));

      })
    }, 1000)
  }

  start() {
    // create necessary tables if not exist
    this.db.exec(schema);
    this.bot.login(process.env.BOT_TOKEN);
  }
}
