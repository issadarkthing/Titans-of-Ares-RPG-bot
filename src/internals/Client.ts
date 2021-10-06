import { Database, verbose } from "sqlite3";
import { CommandManager } from "./Command";
import Discord, { Guild, TextChannel } from "discord.js";
import { schema } from "../db/schema";
import { Phase } from "./TeamArena";
import { SafeFn } from "./SafeFn";
import { Player } from "./Player";
import { getUsers } from "../db/player";
import { MersenneTwister19937, Random } from "random-js";

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
  readonly safeFn = new SafeFn();
  readonly blockingPoll = new Set<BlockingPollHandler>();
  readonly bot = new Discord.Client();
  readonly random = new Random(MersenneTwister19937.autoSeed());
  db: Database;
  mainGuild!: Guild;
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

  async runEveryPlayer(fn: (player: Player) => Promise<void> | void) {

    const users = await getUsers();
    const guild = await this.bot.guilds.fetch(this.serverID);
    const members = await guild.members.fetch();
    let alteredUsers = 0;

    this.db.exec("BEGIN TRANSACTION");
    for (const user of users) {
      const member = members.get(user.DiscordID);
      if (!member) {
        console.log(`Skipping ${user.DiscordID}, member no longer in the server`);
        continue;
      }

      const player = await Player.getPlayer(member);
      await fn(player);

      alteredUsers++;
    }
    this.db.exec("COMMIT");

    console.log(`Total ${alteredUsers} players have been altered`);
  }

  startPollEvent() {
    setInterval(() => {
      // runs all normal poll without having to wait if previous poll handler
      // not finished
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
