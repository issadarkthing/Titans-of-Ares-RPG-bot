import { MersenneTwister19937, Random } from "random-js";

export const RED = "#FF0000";
export const GREEN = "#008000";
export const GOLD = "#ffd700";
export const PLAYER_CRIT_GIF = "https://i.gifer.com/FSka.gif";
export const CHALLENGER_CRIT_GIF = "https://i.pinimg.com/originals/40/96/d1/4096d1659e8c58bb51375133ab5f459e.gif";

// returns xp needed to get to the next level
export function getLevelThreshold(level: number) {
  return (10 + (level * 0.5));
}

export function getXp(point: number) {
  return point * 2;
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
