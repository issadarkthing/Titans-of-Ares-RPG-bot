import { MersenneTwister19937, Random } from "random-js";
import crypto from "crypto";

export const RED = "#FF0000";
export const GREEN = "#008000";
export const GOLD = "#ffd700";
export const BROWN = "#c66a10";
export const PLAYER_CRIT_GIF = "https://i.gifer.com/FSka.gif";
export const CHALLENGER_CRIT_GIF = "https://i.pinimg.com/originals/40/96/d1/4096d1659e8c58bb51375133ab5f459e.gif";
export const CDN_LINK = "https://cdn.discordapp.com/attachments/";
export const STAR = "⭐";

// returns xp needed to get to the next level
export function getLevelThreshold(level: number) {
  return (10 + (level * 0.5));
}

export function getXp(point: number) {
  return point * 2;
}

export function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    return setTimeout(() => resolve(), ms);
  });
}

export function getLevel(xp: number) {

  let level = 1;
  let nextLevelThreshold = getLevelThreshold(level);

  while (xp > nextLevelThreshold) {
    xp -= nextLevelThreshold;
    nextLevelThreshold = getLevelThreshold(++level);
  }

  return level;
}

export function getStats(level: number) {
  const hp = level * 5;
  const strength = level * 1;
  const speed = level * 1;
  const armor = level * 0;
  return { hp, strength, speed, armor }
}

export const random = () => new Random(MersenneTwister19937.autoSeed());


export function numberFormat(value: number) {
  if (Number.isInteger(value)) {
    return value;
  }

  return value.toFixed(2);
}

export function hash(data: string) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** total xp needed to reach given level */
export function absoluteXP(level: number) {

  let accXP = 0;
  let lvl = level;

  while(lvl > 1)
    accXP += getLevelThreshold(--lvl);

  return accXP;
}

export function aggregate(items: string[]): { [key: string]: number } {

  const result: any = {};

  for (const item of items) {
    if (result[item]) {
      result[item]++;
      continue;
    }

    result[item] = 1;
  }

  return result;
}

export function aggregateBy<T>(items: T[], pred: (item: T) => string) {
  return aggregate(items.map(pred));
}
