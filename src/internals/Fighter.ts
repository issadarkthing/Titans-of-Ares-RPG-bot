import { random } from "./utils";

export const CRIT_RATE = 2;

export interface IFighter {
  name: string;
  level: number;
  hp: number;
  strength: number;
  speed: number;
  armor: number;
  critRate: number;
  critDamage: number;
  imageUrl: string;
}

export enum Attributes {
  HP = "HP",
  STRENGTH = "Strength",
  SPEED = "Speed",
  ARMOR = "Armor",
  CRIT_RATE = "Crit Rate",
  CRIT_DAMAGE = "Crit Damage",
}

/** stats that are not affected by any buff or boost */
export interface BaseStats {
  hp: number;
  strength: number;
  speed: number;
  armor: number;
  critRate: number;
  critDamage: number;
}

// Fighter implements battle fight
export class Fighter {

  name: string;
  level: number;
  hp: number;
  strength: number;
  speed: number;
  armor: number;
  critRate: number;
  critDamage: number;
  imageUrl: string;

  constructor(data: IFighter) {
    this.name = data.name;
    this.level = data.level;
    this.hp = data.hp;
    this.strength = data.strength;
    this.speed = data.speed;
    this.armor = data.armor;
    this.critRate = data.critRate;
    this.critDamage = data.critDamage;
    this.imageUrl = data.imageUrl;
  }

  get penetration() {
    return 0;
  }

  isCriticalHit() {
    return random().bool(this.critRate);
  }

  getArmorReduction(attack: number, penetrate: number) {
    const penetrated = this.armor * (1 - penetrate);
    const armor = 100 / (100 + penetrated);
    const damageDone = attack * armor;
    return attack - damageDone;
  }
}
