import { verbose } from 'sqlite3';
import { Client, TextChannel } from 'discord.js';
import path from 'path';
import { profile } from "./commands/profile";
import rank from "./commands/rank";
import help from './commands/help';
import { xpLog } from "./internals/xpLog";
import award from "./commands/award";
import { xp } from './commands/xp';
import { battle } from './commands/battle';
import { 
  makeChallengerTable, 
  makePlayerTable, 
  makeProfileTable, 
  makeTimerTable, 
  makeXPEntryTable,
  makeInventoryTable,
  makePetTable,
  makeGearTable,
} from "./db/schema";
import { energyMainLoop } from './internals/energy';
import { Buff } from './internals/Buff';
import { inventory } from "./commands/inventory";
import { pet } from "./commands/pet";
import { shop } from "./commands/shop";
import { gearCmd } from "./commands/gear";
import { coinShop } from "./commands/coinShop";
import { arenaShop } from "./commands/arenaShop";

const sqlite3 = verbose();
export const PREFIX = process.env.PREFIX!;
export const OLD_BOT_ID = process.env.OLD_BOT_ID!;
export const RANK_CHANNEL = process.env.RANK_CHANNEL!;
export const XP_LOG_CHANNEL = process.env.XP_LOG_CHANNEL!;
export const DB = process.env.DB!;
export const SERVER_ID = process.env.SERVER_ID!;
export const DEV_ID = process.env.DEV_ID!;

export const db = new sqlite3.Database(path.resolve(__dirname, DB));
export const client = new Client();

// create necessary tables if not exist
setImmediate(() => {
  db.run(makePlayerTable);
  db.run(makeChallengerTable);
  db.run(makeTimerTable);
  db.run(makeXPEntryTable);
  db.run(makeProfileTable);
  db.run(makeInventoryTable);
  db.run(makePetTable);
  db.run(makeGearTable);
})

setInterval(() => {
  energyMainLoop();
  Buff.mainLoop();
}, 1000) // run every second

// stores discord id of user that triggers the xp log
export let xpLogTriggers = "";

export let logChannel: TextChannel;

client.once('ready', async () => {
  console.log('Bot is ready');
  const guild = await client.guilds.fetch(SERVER_ID);
  logChannel = guild.channels.cache.get(XP_LOG_CHANNEL) as TextChannel;
})


client.on('message', (msg) => {

  const words = msg.content.split(' ');
  const command = words[0];
  const args = words.slice(1);

  if (
    msg.content.startsWith("Registered") 
    && (msg.author.id === OLD_BOT_ID || msg.author.id === DEV_ID)
  ) {
    rank(msg, ["10"]);
    xpLog(msg);
    
  } else if (command.startsWith("!") && !msg.author.bot) {
    xpLogTriggers = msg.author.id;

  } else if (!command.startsWith(PREFIX) || msg.author.bot) {
    return;
  }

  const cmd = command.replace(PREFIX, '').toLowerCase();
  switch (cmd) {
    case 'p':
    case 'profile':
      profile(msg, args);
      break;
    case 'rank':
      rank(msg, args);
      break;
    case 'help':
      help(msg, args);
      break;
    case 'award':
      award(msg, args);
      break;
    case 'xp':
      xp(msg, args);
      break;
    case 'battle':
      battle(msg, args);
      break;
    case 'inv':
    case 'inventory':
      inventory(msg, args);
      break;
    case 'pets':
    case 'pet':
      pet(msg, args);
      break;
    case 'shops':
    case 'shop':
      shop(msg, args);
      break;
    case 'coinshop':
      coinShop(msg, args);
      break;
    case 'arenashop':
      arenaShop(msg, args);
      break;
    case 'gear':
      gearCmd(msg, args);
      break;
  }
})

client.login(process.env.BOT_TOKEN);
