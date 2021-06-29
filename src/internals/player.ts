import { getLevel, getLevelThreshold, getStats, GOLD } from "./utils";
import { getTotalPoints, getTotalXp } from "../db/getTotalPoints";
import { GuildMember, MessageAttachment, MessageEmbed } from "discord.js";
import { IFighter, Fighter } from "./fighter";
import { setCoin } from "../db/getCoins";
//@ts-ignore
import { Rank } from "canvacord";
import { createUser, getUser, getUsers } from "../db/getUsers";
import { client } from "../index";
import { backgrounds } from "../commands/rank";
import { stripIndents } from "common-tags";
import { MAX_ENERGY, showTimeLeft } from "./timers";

export const CRIT_CHANCE = 0.1;

export interface IPlayer extends IFighter {
  xp: number;
  points: number;
  energy: number;
  coins: number;
  userID: string;
  challengerMaxLevel: number;
  // needed for the stupid rankcord library
  discriminator: string;
  critRate: number;
}

export class Player extends Fighter {

  xp: number;
  points: number;
  coins: number;
  energy: number;
  challengerMaxLevel: number;
  readonly userID: string;
  readonly discriminator: string;
  readonly critChance: number;

  constructor(data: IPlayer) {
    super(data);
    this.xp = data.xp;
    this.points = data.points;
    this.coins = data.coins;
    this.userID = data.userID;
    this.discriminator = data.discriminator;
    this.critChance = data.critRate;
    this.energy = data.energy;
    this.challengerMaxLevel = data.challengerMaxLevel;
  }

  static async getPlayer(member: GuildMember): Promise<Player> {
    const userId = member.user.id;
    const totalXp = await getTotalXp(userId);
    const totalPoints = await getTotalPoints(userId);
    const level = getLevel(totalXp);
    const stats = getStats(level);
    let player = await getUser(userId);
    if (!player) {
      player = await createUser(userId);
    }

    return new Player({
      name: member.displayName,
      level,
      hp: stats.hp,
      strength: stats.strength,
      speed: stats.speed,
      armor: stats.armor,
      criticalChance: CRIT_CHANCE,
      imageUrl: member.user.displayAvatarURL({ format: "jpg" }),
      points: totalPoints,
      xp: totalXp,
      coins: player.Coin,
      userID: member.user.id,
      discriminator: member.user.discriminator,
      critRate: 0.1,
      energy: player.Energy,
      challengerMaxLevel: player.ChallengerMaxLevel,
    })
  }

  async getRank() {

    const guild = client.guilds.cache.get("754602090357325863");
    const users = await getUsers();
    const cards: { 
      member: GuildMember, 
        point: number,
        xp: number,
    }[] = [];

    await guild?.members.fetch();

    for (const user of users) {

      let member = guild?.members.cache.get(user.DiscordID);
      if (!member) {
        continue;
      }

      const xp = await getTotalXp(user.DiscordID);
      const point = await getTotalPoints(user.DiscordID);
      cards.push({ member, xp, point });
    }

    cards.sort((a, b) => b.xp - a.xp);

    const rank = cards.findIndex(x => x.member.user.id === this.userID)!;
    return rank + 1;
  }

  async getProfile() {

    const xp = this.xp;
    const level = this.level;
    const levelThreshold = getLevelThreshold(level);
    const rank = await this.getRank();
    const color = "#111";
    const image = backgrounds[rank];

    let accPrevLevel = 0;
    let lvl = level;

    while (lvl > 1)
      accPrevLevel += getLevelThreshold(--lvl);

    const rankCard = await new Rank()
      .setAvatar(this.imageUrl)
      .setCurrentXP(Math.round(xp - accPrevLevel))
      .setRequiredXP(Math.round(levelThreshold))
      .setLevel(level)
      .setRank(rank, "")
      .setProgressBar("#ff0800", "COLOR", false)
      .setOverlay("#000000")
      .setUsername(this.name)
      .setDiscriminator(this.discriminator)
      .setBackground(image ? "IMAGE" : "COLOR", image || color)
      .build();

    return new MessageAttachment(rankCard, "rank.png");
  }

  async getStats() {
    const energyTimer = await showTimeLeft(this.userID);
    const embed = new MessageEmbed()
      .setColor(GOLD)
      .setTitle(this.name)
      .addField("-----", stripIndents`
        **Stats**
        XP: \`${this.xp}\` HP: \`${this.hp}\` Strength: \`${this.strength}\`
        Speed: \`${this.speed}\` Armor: \`${this.armor}\` 
        Crit Rate: \`${this.critChance * 100}%\` Crit Damage: \`x2\` 
        
        **Inventory**
        Coins: \`${this.coins}\`

        **Energy**
        ${this.energy}/${MAX_ENERGY} ${energyTimer}
      `);

    return embed;
  }

  // this adds or deduces the amount of coins of a player
  async addCoin(amount: number) {
    await setCoin(this.userID, this.coins + amount);
    this.coins += amount;
  }
}


