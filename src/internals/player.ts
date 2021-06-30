import { getLevel, getLevelThreshold, getStats, GOLD } from "./utils";
import { getTotalPoints, getTotalXp } from "../db/getTotalPoints";
import { GuildMember, MessageAttachment, MessageEmbed } from "discord.js";
import { IFighter, Fighter } from "./fighter";
import { setCoin } from "../db/getCoins";
//@ts-ignore
import { Rank } from "canvacord";
import { createUser, getUser, getUsers } from "../db/getUsers";
import { client, SERVER_ID } from "../index";
import { backgrounds } from "../commands/rank";
import { stripIndents } from "common-tags";
import { MAX_ENERGY, showTimeLeft } from "./energy";
import { Buff, BuffID } from "./buff";
import { TimerType } from "../db/timer";

export const CRIT_RATE = 0.1;
export const CRIT_DAMAGE = 2;

export interface IPlayer extends IFighter {
  xp: number;
  points: number;
  energy: number;
  coins: number;
  userID: string;
  challengerMaxLevel: number;
  // needed for the stupid rankcord library
  discriminator: string;
  buff: BuffID | null;
}

export class Player extends Fighter {

  xp: number;
  points: number;
  coins: number;
  energy: number;
  challengerMaxLevel: number;
  buff: Buff | null;
  readonly userID: string;
  readonly discriminator: string;

  constructor(data: IPlayer) {
    super(data);
    this.xp = data.xp;
    this.points = data.points;
    this.coins = data.coins;
    this.userID = data.userID;
    this.discriminator = data.discriminator;
    this.energy = data.energy;
    this.challengerMaxLevel = data.challengerMaxLevel;
    this.buff = data.buff && new Buff(data.buff);
    this.buff?.use(this);
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
      critRate: CRIT_RATE,
      critDamage: CRIT_DAMAGE,
      imageUrl: member.user.displayAvatarURL({ format: "jpg" }),
      points: totalPoints,
      xp: totalXp,
      coins: player.Coin,
      userID: member.user.id,
      discriminator: member.user.discriminator,
      energy: player.Energy,
      challengerMaxLevel: player.ChallengerMaxLevel,
      buff: player.Buff,
    })
  }

  async getRank() {

    const guild = client.guilds.cache.get(SERVER_ID!);
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
    const energyTimer = await showTimeLeft(TimerType.Energy, this.userID);
    const buffTimer = await this.buff?.getTimeLeft(this);
    const embed = new MessageEmbed()
      .setColor(GOLD)
      .setTitle(this.name)
      .addField("-----", stripIndents`
        **Stats**
        XP: \`${this.xp}\` HP: \`${this.hp}\` Strength: \`${this.strength}\`
        Speed: \`${this.speed}\` Armor: \`${this.armor}\` 
        Crit Rate: \`${this.critRate * 100}%\` Crit Damage: \`x${this.critDamage}\` 
        
        **Inventory**
        Coins: \`${this.coins}\`

        **Energy**
        ${this.energy}/${MAX_ENERGY} ${energyTimer}

        **Buff**
        ${this.buff?.getName() || ""} ${buffTimer || ""}
      `);

    return embed;
  }

  // this adds or deduces the amount of coins of a player
  async addCoin(amount: number) {
    await setCoin(this.userID, this.coins + amount);
    this.coins += amount;
  }
}


