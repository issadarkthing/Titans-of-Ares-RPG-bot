import { getLevel, getLevelThreshold, getStats, GOLD } from "./utils";
import { getTotalPoints, getTotalXp } from "../db/getTotalPoints";
import { GuildMember, MessageAttachment, MessageEmbed } from "discord.js";
import { IFighter, Fighter } from "./battle";
import { getCoin, setCoin } from "../db/getCoins";
//@ts-ignore
import { Rank } from "canvacord";
import { getUsers } from "../db/getUsers";
import { client } from "../index";
import { backgrounds } from "../commands/rank";

export const CRIT_CHANCE = 0.1;

export interface IPlayer extends IFighter {
  xp: number;
  points: number;
  coins: number;
  userID: string;
  // needed for the stupid rankcord library
  discriminator: string;
}

export class Player extends Fighter {

  xp: number;
  points: number;
  coins: number;
  readonly userID: string;
  readonly discriminator: string;

  constructor(data: IPlayer) {
    super(data);
    this.xp = data.xp;
    this.points = data.points;
    this.coins = data.coins;
    this.userID = data.userID;
    this.discriminator = data.discriminator;
  }

  static async getPlayer(member: GuildMember): Promise<Player> {
    const userId = member.user.id;
    const totalXp = await getTotalXp(userId);
    const totalPoints = await getTotalPoints(userId);
    const level = getLevel(totalXp);
    const stats = getStats(level);
    const coins = await getCoin(userId);
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
      coins: coins,
      userID: member.user.id,
      discriminator: member.user.discriminator,
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

  getStats() {
    const embed = new MessageEmbed()
      .setColor(GOLD)
      .addField("Total XP", this.xp, true)
      .addField("HP", this.hp, true)
      .addField("Strength", this.strength, true)
      .addField("Speed", this.speed, true)
      .addField("Armor", this.armor, true)
      .addField("Coins", this.coins, true)

    return embed;
  }

  // this adds or deduces the amount of coins of a player
  async addCoin(amount: number) {
    await setCoin(this.userID, this.coins + amount);
    this.coins += amount;
  }
}


