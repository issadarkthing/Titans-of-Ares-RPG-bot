


export abstract class Attribute {
  abstract name: string;
  abstract key: string;
  abstract id: string;
}

class HP extends Attribute {
  name = "HP";
  id = "hp";
  key = "hp";
}

class Strength extends Attribute {
  name = "Strength";
  id = "strength";
  key = "strength";
}

class Speed extends Attribute {
  name = "Speed";
  id = "speed";
  key = "speed";
}

class Armor extends Attribute {
  name = "Armor";
  id = "armor";
  key = "armor";
}

class CritRate extends Attribute {
  name = "Crit Rate";
  id = "crit_rate";
  key = "critRate";
}

class CritDamage extends Attribute {
  name = "Crit Damage";
  id = "crit_damage";
  key = "critDamage";
}

class ArmorPenetration extends Attribute {
  name = "Armor Penetration";
  id = "armor_penetration";
  key = "armorPenetration";
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
