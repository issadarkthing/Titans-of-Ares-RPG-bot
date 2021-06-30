import { random } from "./utils";


const commonPercentage = [10, 15, 20, 25, 50];

const buffs = {
  hp: commonPercentage,
  critRate: [2, 4, 6, 8, 15],
  critDamage: [0.1, 0.2, 0.3, 0.4, 1],
  strength: commonPercentage,
  speed: commonPercentage,
}

const chances = [400, 300, 150, 100, 50]


type BuffRaw = typeof buffs;
type BuffType = keyof BuffRaw;
type BuffLevel = 1 | 2 | 3 | 4 | 5;
export type BuffID = `${BuffType}_${BuffLevel}`;

export class Buff {

  readonly type: BuffType;
  readonly level: BuffLevel;

  constructor(id: BuffID) {
    const args = id.split("_");
    const type = args[0] as BuffType;
    const level = parseInt(args[1]) as BuffLevel;

    if (!args[0] || !args[1])
      throw new Error("invalid buff id");

    this.type = type;
    this.level = level;
  }

  // randomly picks level according to its rarity
  private static pickBuffLevel() {
    const samples = chances
      .map((count, index) =>  Array(count).fill(index))
      .flat();
    const randomizedSample = random().shuffle<BuffLevel>(samples);
    return random().pick(randomizedSample);
  }

  // randomly choses buff according to its rarity
  static random() {
    const buffTypes = Object.keys(buffs);
    const buffType = random().pick(buffTypes) as BuffType;
    const buffLevel = this.pickBuffLevel();
    return new Buff(`${buffType}_${buffLevel}` as BuffID);
  }

  getID(): BuffID {
    return `${this.type}_${this.level}` as BuffID;
  }

  getName() {

    const buffLevelName = [
      "Common",
      "Uncommon",
      "Rare",
      "Epic",
      "Legendary",
    ];

    const buffTypeName = {
      hp: "HP",
      critRate: "Crit Rate",
      critDamage: "Crit Damage",
      strength: "Strength",
      speed: "Speed",
    }

    const typeName = buffTypeName[this.type];
    const levelName = buffLevelName[this.level];

    if (this.type === "critDamage") {
      return `${levelName} ${typeName} buff x${this.getValue()}`;
    } else {
      return `${levelName} ${typeName} buff +${this.getValue()}%`;
    }

  }

  // returns buff value based on type
  getValue() {
    return buffs[this.type][this.level];
  }
}
