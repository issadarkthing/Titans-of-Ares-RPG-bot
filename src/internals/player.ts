import { getLevel, getStats } from "./utils";
import { getTotalPoints, getTotalXp } from "../db/getTotalPoints";
import { Random } from "random-js";
import { GuildMember } from "discord.js";

export const CRIT_RATE = 2;

export interface PlayerInit {
  name: string;
  level: number;
  xp: number;
  point: number;
  hp: number;
  strength: number;
  speed: number;
  armor: number;
  // 10% chance to hit critical attack (2x)
  criticalChance: number;
  imageUrl: string;
}

export class Player {
  name: string;
  level: number;
  xp: number;
  readonly maxHp: number;
  point: number;
  hp: number;
  strength: number;
  speed: number;
  armor: number;
  criticalChance: number;
  imageUrl: string;

  constructor(data: PlayerInit) {
    this.name = data.name;
    this.level = data.level;
    this.xp = data.xp;
    this.point = data.point;
    this.hp = data.hp;
    this.maxHp = data.hp;
    this.strength = data.strength;
    this.speed = data.speed;
    this.armor = data.armor;
    this.criticalChance = data.criticalChance;
    this.imageUrl = data.imageUrl;
  }

  static async getPlayer(member: GuildMember): Promise<Player> {
    const userId = member.user.id;
    const totalXp = await getTotalXp(userId);
    const totalPoints = await getTotalPoints(userId);
    const level = getLevel(totalXp);
    const stats = getStats(level);
    return new Player({
      ...stats,
      name: member.displayName,
      level,
      xp: totalXp,
      point: totalPoints,
      criticalChance: 0.1,
      imageUrl: member.user.displayAvatarURL(),
    })
  }

  static getChallenger(challenger: PlayerInit) {
    return new Player(challenger);
  }

  // Attack mutates the challenger hp to simulate attack. It also accounts for
  // critical hit. This method returns true if the attack was a critical hit.
  attack(challenger: Player) {
    const isCrit = this.isCriticalHit();
    const attackRate = isCrit ? CRIT_RATE * this.strength : this.strength;
    challenger.hp -= attackRate;
    return isCrit;
  }

  isCriticalHit() {
    const random = new Random();
    return random.bool(this.criticalChance);
  }
}


