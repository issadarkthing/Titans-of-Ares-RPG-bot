
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

