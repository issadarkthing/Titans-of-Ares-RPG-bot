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

  isCriticalHit() {
    return random().bool(this.critRate);
  }

  /** Attack mutates the challenger hp to simulate attack. It also accounts for
  * critical hit. This method returns true if the attack was a critical hit.
  */
  attack(challenger: Fighter) {
    const isCrit = this.isCriticalHit();
    const attackRate = isCrit ? CRIT_RATE * this.strength : this.strength;
    const damageReduction = this.getArmorReduction(attackRate);
    const damageDone = (attackRate - damageReduction);
    challenger.hp -= damageDone;
    return [isCrit, attackRate, damageReduction, damageDone] as const;
  }

  getArmorReduction(attack: number) {
    const armor = 100 / (100 + this.armor);
    const damageDone = attack * Math.round(armor);
    return attack - damageDone;
  }
}
