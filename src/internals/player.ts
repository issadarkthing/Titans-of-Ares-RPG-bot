import { getLevel, getStats } from "./utils";
import { getTotalPoints, getTotalXp } from "../db/getTotalPoints";
import { GuildMember } from "discord.js";
import { IFighter, Fighter } from "./battle";

export const CRIT_CHANCE = 0.1;

export interface IPlayer extends IFighter {
  xp: number;
  points: number;
}

export class Player extends Fighter {

  xp: number;
  points: number;

  constructor(data: IPlayer) {
    super(data);
    this.xp = data.xp;
    this.points = data.points;
  }

  static async getPlayer(member: GuildMember): Promise<Player> {
    const userId = member.user.id;
    const totalXp = await getTotalXp(userId);
    const totalPoints = await getTotalPoints(userId);
    const level = getLevel(totalXp);
    const stats = getStats(level);
    return new Player({
      name: member.displayName,
      level,
      hp: stats.hp,
      strength: stats.strength,
      speed: stats.speed,
      armor: stats.armor,
      criticalChance: CRIT_CHANCE,
      imageUrl: member.user.displayAvatarURL(),
      points: totalPoints,
      xp: totalXp,
    })
  }
}


