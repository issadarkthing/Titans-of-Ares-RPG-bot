
export function getLevelThreshold(level: number) {
  return Math.round(10 + (level * 20));
}

export function getXp(point: number) {
  return Math.round(point * 2);
}

export function getLevel(xp: number) {

  let level = 1;
  let nextLevelThreshold = getLevelThreshold(level);

  while (xp > nextLevelThreshold)
    nextLevelThreshold = getLevelThreshold(++level);

  return level;
}
