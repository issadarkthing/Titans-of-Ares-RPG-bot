import { BaseStats } from "./Fighter";
import { inlineCode, roundTo } from "./utils";

/**
 * Sets format options for attribute. By default, it will return only number
 * with appropriate formatting such as decimal places and adding % for a
 * particular attribute.
 * */
interface FormatOptions {
  /** Add inline code formatting */
  highlight?: boolean;
  /** Add "+" in front */
  suffix?: boolean;
  /** Add attribute name at the back */
  prefix?: boolean;
}

export abstract class Attribute {
  abstract name: string;
  abstract key: keyof BaseStats;
  abstract id: string;

  format(attribValue: number, opt: FormatOptions = {}) {
    let stat = "";

    if (opt.prefix) {
      stat += "+";
    }

    switch (this.key) {
      case "armor":
        stat = `${roundTo(attribValue, 1)}`;
      break;
      case "critRate":
        stat = `${roundTo(attribValue * 100, 1)}%`;
      break;
      case "critDamage":
        stat = `x${roundTo(attribValue, 2)}`;
      break;
      default:
        stat = `${Math.round(attribValue)}`;
    }

    if (opt.highlight) {
      stat = inlineCode(stat);
    }

    if (opt.suffix) {
      stat += " " + this.name;
    }

    return stat;
  }
}

class HP extends Attribute {
  name = "HP";
  id = "hp";
  key = "hp" as keyof BaseStats;
}

class Strength extends Attribute {
  name = "Strength";
  id = "strength";
  key = "strength" as keyof BaseStats;
}

class Speed extends Attribute {
  name = "Speed";
  id = "speed";
  key = "speed" as keyof BaseStats;
}

class Armor extends Attribute {
  name = "Armor";
  id = "armor";
  key = "armor" as keyof BaseStats;
}

class CritRate extends Attribute {
  name = "Crit Rate";
  id = "crit_rate";
  key = "critRate" as keyof BaseStats;
}

class CritDamage extends Attribute {
  name = "Crit Damage";
  id = "crit_damage";
  key = "critDamage" as keyof BaseStats;
}

class ArmorPenetration extends Attribute {
  name = "Armor Penetration";
  id = "armor_penetration";
  key = "armorPenetration" as keyof BaseStats;
}

export class Attributes {
  static hp = new HP();
  static strength = new Strength();
  static speed = new Speed();
  static armor = new Armor();
  static critRate = new CritRate();
  static critDamage = new CritDamage();
  static armorPenetration = new ArmorPenetration();
  static all = [
    Attributes.hp,
    Attributes.strength,
    Attributes.speed,
    Attributes.armor,
    Attributes.critRate,
    Attributes.critDamage,
    Attributes.armorPenetration,
  ];

  static fromString(identifier: string) {

    for (const attr of this.all) {

      let isEqual = attr.id === identifier;
      isEqual ||= attr.key === identifier;
      isEqual ||= attr.name === identifier;

      if (isEqual) return attr;
    }

    throw new Error(`${identifier} is not a valid attribute`);
  }

  static aggregate(attribs: [Attribute, number][]) {

    const acc: BaseStats = {
      hp: 0,
      strength: 0,
      speed: 0,
      armor: 0,
      critRate: 0,
      critDamage: 0,
      armorPenetration: 0,
    };

    for (const [attrib, attribValue] of attribs) {
      acc[attrib.key] += attribValue;
    }

    return acc;
  }

  static toStats(stats: BaseStats) {
    const result: string[] = [];

    for (const [key, value] of Object.entries(stats)) {
      const attribute = Attributes.fromString(key);
      const formatOpt = {
        highlight: true,
        suffix: true,
        prefix: true,
      };
      result.push(attribute.format(value, formatOpt));
    }

    return result;
  }
}
