import { BaseStats } from "./Fighter";



export abstract class Attribute {
  abstract name: string;
  abstract key: keyof BaseStats;
  abstract id: string;
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
}
