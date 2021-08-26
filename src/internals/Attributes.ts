


export abstract class Attribute {
  abstract name: string;
  abstract key: string;
  abstract id: string;
}

class HP extends Attribute {
  name = "HP";
  key = "hp";
  id = "hp";
}

class Strength extends Attribute {
  name = "Strength";
  key = "strength";
  id = "strength";
}

class Speed extends Attribute {
  name = "Speed";
  key = "speed";
  id = "speed";
}

class Armor extends Attribute {
  name = "Armor";
  key = "armor";
  id = "armor";
}

class CritRate extends Attribute {
  name = "Crit Rate";
  key = "crit_rate";
  id = "critRate";
}

class CritDamage extends Attribute {
  name = "Crit Damage";
  key = "crit_damage";
  id = "critDamage";
}

class ArmorPenetration extends Attribute {
  name = "Armor Penetration";
  key = "armor_penetration";
  id = "armorPenetration";
}

export class Attributes {
  static hp = new HP();
  static strength = new Strength();
  static speed = new Speed();
  static armor = new Armor();
  static critRate = new CritRate();
  static critDamage = new CritDamage();
  static armorPenetration = new ArmorPenetration();
  static attributes = [
    Attributes.hp,
    Attributes.strength,
    Attributes.speed,
    Attributes.armor,
    Attributes.critRate,
    Attributes.critDamage,
    Attributes.armorPenetration,
  ];

  static fromString(identifier: string) {

    for (const attr of this.attributes) {

      let isEqual = attr.id === identifier;
      isEqual ||= attr.key === identifier;
      isEqual ||= attr.name === identifier;

      if (isEqual) return attr;
    }

    throw new Error(`${identifier} is not a valid attribute`);
  }
}
