import { BaseStats } from "./Fighter";
import { Attributes, Attribute } from "./Attributes"
import { random } from "./utils";
import { List } from "./List";

export abstract class Stone {
  abstract attribute: Attribute;
  abstract attributeValue: number;
  abstract rarity: number;
}


export abstract class Gem extends Stone {
  readonly attribute: Attribute;
  readonly attributeValue: number;
  static baseStats: BaseStats;

  constructor(attribute: Attribute, attributeValue: number) {
    super();
    this.attribute = attribute;
    this.attributeValue = attributeValue;
  }

  static fromDB(stoneID: string) {
    const [, rarity, attribID, attribValue] = stoneID.split("_");
    const attribute = Attributes.fromString(attribID);
    const attributeValue = parseInt(attribValue);
    return Gem.fromRarity(rarity, attribute, attributeValue);
  }

  static fromRarity(
    name: string, 
    attribute: Attribute, 
    attributeValue: number,
  ) {
    switch (name) {
      case "common": return new Common(attribute, attributeValue);
      case "uncommon": return new Uncommon(attribute, attributeValue);
      case "rare": return new Rare(attribute, attributeValue);
      case "epic": return new Epic(attribute, attributeValue);
      case "legendary": return new Legendary(attribute, attributeValue);
    }

    throw new Error(`invalid rarity "${name}"`);
  }

  static random() {
    const allGems = List.from([
      Common.random(),
      Uncommon.random(),
      Rare.random(),
      Epic.random(),
      Legendary.random(),
    ]);

    return allGems.weightedRandom(gem => gem.rarity * 1000);
  }

  get name() {
    return `${this.rarity} ${this.attribute.name} Gem`;
  }

  get id() {
    const rarityName = this.constructor.name;
    const attribID = this.attribute.id;
    return `gem_${rarityName}_${attribID}_${this.attributeValue}`;
  }
}

export class RoughStone {
  name = "Rough Stone";
  id = "stone_rough";
}

export class Common extends Gem {
  rarity = 0.1;

  static baseStats: BaseStats = {
    hp: 50,
    strength: 10,
    armor: 1,
    speed: 10,
    critRate: 0.04,
    critDamage: 0.2,
    armorPenetration: 0.04,
  }

  static random() {
    const attributes: [string, number][] = Object.entries(this.baseStats);
    const [attributeName, attributeValue] = random().pick(attributes);
    const attribute = Attributes.fromString(attributeName);
    return new Common(attribute, attributeValue);
  }
}


export class Uncommon extends Gem {
  rarity = 0.04;

  static baseStats: BaseStats = {
    hp: 80,
    strength: 16,
    armor: 1.6,
    speed: 16,
    critRate: 0.064,
    critDamage: 0.3,
    armorPenetration: 0.06,
  }

  static random() {
    const attributes: [string, number][] = Object.entries(this.baseStats);
    const [attributeName, attributeValue] = random().pick(attributes);
    const attribute = Attributes.fromString(attributeName);
    return new Uncommon(attribute, attributeValue);
  }
}


export class Rare extends Gem {
  rarity = 0.007;

  static baseStats: BaseStats = {
    hp: 120,
    strength: 24,
    armor: 2.4,
    speed: 24,
    critRate: 0.096,
    critDamage: 0.3,
    armorPenetration: 0.06,
  }

  static random() {
    const attributes: [string, number][] = Object.entries(this.baseStats);
    const [attributeName, attributeValue] = random().pick(attributes);
    const attribute = Attributes.fromString(attributeName);
    return new Rare(attribute, attributeValue);
  }
}

export class Epic extends Gem {
  rarity = 0.002;

  static baseStats: BaseStats = {
    hp: 150,
    strength: 30,
    armor: 3,
    speed: 30,
    critRate: 0.12,
    critDamage: 0.6,
    armorPenetration: 0.12,
  }

  static random() {
    const attributes: [string, number][] = Object.entries(this.baseStats);
    const [attributeName, attributeValue] = random().pick(attributes);
    const attribute = Attributes.fromString(attributeName);
    return new Epic(attribute, attributeValue);
  }
}


export class Legendary extends Gem {
  rarity = 0.001;

  static baseStats: BaseStats = {
    hp: 200,
    strength: 40,
    armor: 4,
    speed: 40,
    critRate: 0.16,
    critDamage: 0.8,
    armorPenetration: 0.15,
  }

  static random() {
    const attributes: [string, number][] = Object.entries(this.baseStats);
    const [attributeName, attributeValue] = random().pick(attributes);
    const attribute = Attributes.fromString(attributeName);
    return new Legendary(attribute, attributeValue);
  }
}
