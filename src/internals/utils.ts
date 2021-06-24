
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
