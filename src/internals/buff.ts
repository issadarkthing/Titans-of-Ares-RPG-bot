import { DurationInput } from "luxon";
import { deleteTimer, getAllTimers, TimerType } from "../db/timer";
import { isExpired, showTimeLeft } from "./energy";
import { Player } from "./player";
import { random } from "./utils";

const commonPercentage = [0.1, 0.15, 0.2, 0.25, 0.5];

const buffs = {
  hp: commonPercentage,
  critRate: [0.02, 0.04, 0.06, 0.08, 0.15],
  critDamage: [0.1, 0.2, 0.3, 0.4, 1],
  strength: commonPercentage,
  speed: commonPercentage,
}

const chances = [400, 300, 150, 100, 50];

export const BUFF_EXPIRE: DurationInput = { hours: 2 };
export const XP_THRESHOLD = 20;

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

  static async mainLoop() {
    const timers = await getAllTimers(TimerType.Buff);

    for (const timer of timers) {
      if (isExpired(timer.Expires)) {
        deleteTimer(TimerType.Buff, timer.DiscordID);
      }
    }
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
      return `${levelName} ${typeName} buff \`+x${this.getValue()}\``;
    } else {
      return `${levelName} ${typeName} buff \`+${this.getValue() * 100}%\``;
    }

  }

  // returns buff value based on type
  getValue() {
    return buffs[this.type][this.level];
  }

  use(player: Player) {
    switch (this.type) {
      case "critDamage":
        player.critDamage += this.getValue();
        break;
      case "critRate":
        player.critRate += this.getValue();
        break;
      case "speed":
        player.speed += this.getValue() * player.speed;
        break;
      case "strength":
        player.strength += this.getValue() * player.strength;
        break;
      case "hp":
        player.hp += this.getValue() * player.hp;
        break;
    }
  }

  getTimeLeft(player: Player) {
    const id = player.buff?.getID();
    if (!id) return "";

    return showTimeLeft(TimerType.Buff, player.userID);
  }
}
