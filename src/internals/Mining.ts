import { BaseStats } from "./Fighter";
import { Attributes, Attribute } from "./Attributes"
import { BROWN, CDN_LINK, random } from "./utils";
import { List } from "./List";
import { GemDB } from "../db/gem";
import { MessageEmbed } from "discord.js";

export class MiningPick {
  name = "Mining Pick";
  id = "pick_mining";
  description = "mining pick is used to mine gem";
  miningAnimationUrl = 
    CDN_LINK + "574852830125359126/882898676111003658/mining.gif";

  show(count: number) {

    const embed = new MessageEmbed()
      .setColor(BROWN)
      .setTitle(this.name)
      .setDescription(this.description)
      .addField("count", count, true)

    return embed;
  }

  showMiningAnimation() {

    const embed = new MessageEmbed()
      .setColor(BROWN)
      .setTitle("Mining")
      .setImage(this.miningAnimationUrl);

    return embed;
  }
}

export abstract class Stone {
  abstract id: string;
  abstract name: string;
  abstract rarity: number;
  abstract product: Gem;
  abstract requirement: number;
  abstract show(count: number): MessageEmbed;

  static random() {
    return Stone.all.weightedRandom(x => x.rarity * 1000);
  }

  static get all(): List<Stone> {
    return List.from([
      new RoughStone(),
      ...Gem.all,
    ])
  }
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

  static fromID(stoneID: string) {
    const [, rarity, attribID, attribValue] = stoneID.split("_");
    const attribute = Attributes.fromString(attribID);
    const attributeValue = parseInt(attribValue);
    return Gem.fromRarity(rarity, attribute, attributeValue);
  }

  static fromDB(stoneDB: GemDB) {
   return Gem.fromID(stoneDB.ItemID);
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

  static random(): Gem {
    const name = this.name;

    // subclass
    if (name !== "Gem") {
      const attributes: [string, number][] = Object.entries(this.baseStats);
      const [attributeName, attributeValue] = random().pick(attributes);
      const attribute = Attributes.fromString(attributeName);
      // eslint-disable-next-line
      // @ts-ignore
      return new this.prototype.constructor(attribute, attributeValue);
    }

    const allGems = List.from([
      Common.random(),
      Uncommon.random(),
      Rare.random(),
      Epic.random(),
      Legendary.random(),
    ]);

    return allGems.weightedRandom(gem => gem.rarity * 1000);
  }

  static get all(): List<Gem> {
    const name = this.name;

    // subclass
    if (name !== "Gem") {
      const attributes: [string, number][] = Object.entries(this.baseStats);
      const gems = attributes.map(([attributeName, attributeValue]) => {
        const attribute = Attributes.fromString(attributeName);
        // eslint-disable-next-line
        // @ts-ignore
        return new this.prototype.constructor(attribute, attributeValue);
      });
      return List.from(gems);
    }

    return List.from([
      ...Common.all,
      ...Uncommon.all,
      ...Rare.all,
      ...Epic.all,
      ...Legendary.all,
    ]);
  }

  get name() {
    const gemName = this.constructor.name;
    return `${gemName} ${this.attribute.name} Gem`;
  }

  get id() {
    const rarityName = this.constructor.name.toLowerCase();
    const attribID = this.attribute.key;
    return `gem_${rarityName}_${attribID}_${this.attributeValue}`;
  }

  show(count: number) {

    const embed = new MessageEmbed()
      .setColor(BROWN)
      .setTitle(this.name)
      .setDescription(
        `${this.name} is used to combine and produce ${this.product.name}`
      )
      .addField("Count", count, true)

    return embed;
  }
}

export class RoughStone extends Stone {
  rarity = 0.85;
  name = "Rough Stone";
  id = "stone_rough";
  requirement = 12;
  description = 
    `Rough stone is used to combine and produce ${this.product.name}`;

  get product() {
    return Common.random();
  }

  show(count: number) {

    const embed = new MessageEmbed()
      .setColor(BROWN)
      .setTitle(this.name)
      .setDescription(this.description)
      .addField("Count", count, true)

    return embed;
  }
}

export class Common extends Gem {
  rarity = 0.1;
  requirement = 5;

  get product() {
    return Uncommon.random();
  }

  static baseStats: BaseStats = {
    hp: 50,
    strength: 10,
    armor: 1,
    speed: 10,
    critRate: 0.04,
    critDamage: 0.2,
    armorPenetration: 0.04,
  }
}


export class Uncommon extends Gem {
  rarity = 0.04;
  requirement = 5;

  get product() {
    return Rare.random();
  }

  static baseStats: BaseStats = {
    hp: 80,
    strength: 16,
    armor: 1.6,
    speed: 16,
    critRate: 0.064,
    critDamage: 0.3,
    armorPenetration: 0.06,
  }
}


export class Rare extends Gem {
  rarity = 0.007;
  requirement = 5;

  get product() {
    return Epic.random();
  }

  static baseStats: BaseStats = {
    hp: 120,
    strength: 24,
    armor: 2.4,
    speed: 24,
    critRate: 0.096,
    critDamage: 0.3,
    armorPenetration: 0.06,
  }
}

export class Epic extends Gem {
  rarity = 0.002;
  requirement = 5;

  get product() {
    return Legendary.random();
  }

  static baseStats: BaseStats = {
    hp: 150,
    strength: 30,
    armor: 3,
    speed: 30,
    critRate: 0.12,
    critDamage: 0.6,
    armorPenetration: 0.12,
  }
}


export class Legendary extends Gem {
  rarity = 0.001;
  requirement = 3;

  get product() {
    return Legendary.random();
  }

  static baseStats: BaseStats = {
    hp: 200,
    strength: 40,
    armor: 4,
    speed: 40,
    critRate: 0.16,
    critDamage: 0.8,
    armorPenetration: 0.15,
  }
}
