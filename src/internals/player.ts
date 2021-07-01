import { getLevel, getLevelThreshold, getStats, GOLD, numberFormat } from "./utils";
import { getTotalPoints, getTotalXp } from "../db/getTotalPoints";
import { GuildMember, MessageAttachment, MessageEmbed } from "discord.js";
import { IFighter, Fighter } from "./fighter";
import { setCoin } from "../db/getCoins";
//@ts-ignore
import { Rank } from "canvacord";
import { createUser, getUser, getUsers } from "../db/getUsers";
import { backgrounds } from "../commands/rank";
import { stripIndents } from "common-tags";
import { isExpired, MAX_ENERGY, showTimeLeft } from "./energy";
import { Buff, BuffID } from "./buff";
import { getTimer, TimerType } from "../db/timer";

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

    const buffTimer = await getTimer(TimerType.Buff, userId);
    if (buffTimer) {

      const activeTimeLimit = Buff.getActiveTimeLimit(buffTimer);
      if (isExpired(activeTimeLimit.toISO())) {
        player.Buff = null;
      }
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

    const users = await getUsers();
    const cards: { 
      id: string,
      point: number,
      xp: number,
    }[] = [];


    for (const user of users) {
      const xp = await getTotalXp(user.DiscordID);
      const point = await getTotalPoints(user.DiscordID);
      cards.push({ id: user.DiscordID, xp, point });
    }

    cards.sort((a, b) => b.xp - a.xp);

    const rank = cards.findIndex(x => x.id === this.userID);
    return rank + 1;
  }

  async getProfile() {

    const xp = this.xp;
    const level = this.level;
    const levelThreshold = getLevelThreshold(level);
    const rank = await this.getRank();
    const color = "#111";
    const image = backgrounds[rank - 1];

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
    const xp = numberFormat(this.xp);
    const hp = numberFormat(this.hp);
    const strength = numberFormat(this.strength);
    const speed = numberFormat(this.speed);
    const armor = numberFormat(this.armor);
    const critRate = numberFormat(this.critRate * 100);
    const critDamage = numberFormat(this.critDamage);
    const embed = new MessageEmbed()
      .setColor(GOLD)
      .setTitle(this.name)
      .addField("-----", stripIndents`
        **Stats**
        XP: \`${xp}\` HP: \`${hp}\` Strength: \`${strength}\`
        Speed: \`${speed}\` Armor: \`${armor}\` 
        Crit Rate: \`${critRate}%\` Crit Damage: \`x${critDamage}\` 
        
        **Inventory**
        Coins: \`${this.coins}\`

        **Energy**
        ${this.energy}/${MAX_ENERGY} ${energyTimer}

        **Buffs**
        ${this.buff?.getName() || "None"} ${buffTimer || ""}
      `);

    return embed;
  }

  // this adds or deduces the amount of coins of a player
  async addCoin(amount: number) {
    await setCoin(this.userID, this.coins + amount);
    this.coins += amount;
  }
}


