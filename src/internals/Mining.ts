import { BaseStats } from "./Fighter";
import { Attributes, Attribute } from "./Attributes"
import { BROWN, capitalize, CDN_LINK, inlineCode, random } from "./utils";
import { List } from "./List";
import { GemDB } from "../db/gem";
import { MessageEmbed } from "discord.js";
import { oneLine } from "common-tags";
import { client } from "../main";

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
  abstract inspect(count: number, sameRarityCount: number): MessageEmbed;

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


type ImagesUrl = Record<keyof BaseStats, string>;

export abstract class Gem extends Stone {
  readonly attribute: Attribute;
  readonly attributeValue: number;
  static baseStats: BaseStats;
  static imagesUrl: ImagesUrl;

  constructor(attribute: Attribute) {
    super();
    this.attribute = attribute;
    const gem = (this.constructor as unknown as typeof Gem);
    this.attributeValue = gem.baseStats[this.attribute.key];
  }

  static fromID(stoneID: string) {
    const [, rarity, attribID] = stoneID.split("_");
    const attribute = Attributes.fromString(attribID);
    return Gem.fromRarity(rarity, attribute);
  }

  static fromDB(stoneDB: GemDB) {
   return Gem.fromID(stoneDB.ItemID);
  }

  static fromRarity(
    name: string, 
    attribute: Attribute, 
  ) {
    switch (name) {
      case "common": return new Common(attribute);
      case "uncommon": return new Uncommon(attribute);
      case "rare": return new Rare(attribute);
      case "epic": return new Epic(attribute);
      case "legendary": return new Legendary(attribute);
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

  get rarityName() {
    return this.constructor.name.toLowerCase();
  }

  get id() {
    const rarityName = this.constructor.name.toLowerCase();
    const attribID = this.attribute.key;
    return `gem_${rarityName}_${attribID}`;
  }

  get description() {
    return oneLine`This is a ${this.name}. You can combine multiple gems of the
    same quality to craft a better gem. You can do this in the
    \`${client.prefix}gemcrafting\` menu`;
  }

  get imageUrl() {
    const gem = (this.constructor as unknown as typeof Gem);
    const shortUrl = gem.imagesUrl[this.attribute.key];
    return CDN_LINK + shortUrl;
  }

  get stat() {
    switch (this.attribute.key) {
      case Attributes.critRate.key:
      case Attributes.armorPenetration.key:
        return `+${Math.round(this.attributeValue * 100)}% ${this.attribute.name}`;
      default:
        return `+${this.attributeValue} ${this.attribute.name}`;
    }
  }

  show(count: number) {
    // gems required to upgrade text
    const gems = `x${this.requirement} ${capitalize(this.rarityName)} Gem`;

    const embed = new MessageEmbed()
      .setColor(BROWN)
      .setTitle(this.name)
      .setThumbnail(this.imageUrl)
      .setDescription(this.description)
      .addField("Count", count, true)
      .addField("Stat", inlineCode(this.stat), true)
      .addField("Gems required to upgrade", inlineCode(gems), true)

    return embed;
  }

  inspect(count: number, sameRarityCount: number) {
    const gemInfo = this.show(count);
    const title = `${capitalize(this.rarityName)} gem(s) count`;
    gemInfo.addField(title, sameRarityCount, true);
    return gemInfo;
  }
}

export class RoughStone extends Stone {
  rarity = 0.85;
  name = "Rough Stone";
  id = "stone_rough";
  requirement = 12;
  imageUrl = CDN_LINK + "852530378916888626/883343839006457856/68.png";
  description = oneLine`These are rough stones.  You can combine 12 of them to
  make a common gem. You can do this in the \`${client.prefix}gemcrafting\`
  menu`;

  get product() {
    return Common.random();
  }

  show(count: number) {

    const embed = new MessageEmbed()
      .setColor(BROWN)
      .setTitle(this.name)
      .setThumbnail(this.imageUrl)
      .setDescription(this.description)
      .addField("Count", count, true)

    return embed;
  }

  // eslint-disable-next-line
  inspect(count: number, _: number) {
    return this.show(count);
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

  static imagesUrl: ImagesUrl = {
    hp: "852530378916888626/883344119517282314/Common_HP_Gem.png",
    strength: "852530378916888626/883346582546837564/Common_Strength_Gem.png",
    armor: "852530378916888626/883344368344391730/Common_Armor_Gem.png",
    speed: "852530378916888626/883346343643471922/Common_Speed_Gem.png",
    critRate: "852530378916888626/883345606096068638/Common_Crit_Chance_Gem.png",
    critDamage: "852530378916888626/883345926213759037/Common_Crit_Damage_Gem.png",
    armorPenetration: "852530378916888626/883344730564485150/Common_Armor_Pen_Gem.png",
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

  static imagesUrl: ImagesUrl = {
    hp: "852530378916888626/883344155261161552/Uncommon_HP_Gem.png",
    strength: "852530378916888626/883346601614147634/Uncommon_Strength_Gem.png",
    armor: "852530378916888626/883344391262048287/Uncommon_Armor_Gem.png",
    speed: "852530378916888626/883346390825185330/Rare_Speed_Gem.png",
    critRate: "852530378916888626/883348525138706452/76_1.png",
    critDamage: "852530378916888626/883345951798984714/Uncommon_crit_Damage_Gem.png",
    armorPenetration: "852530378916888626/883357018533007370/Uncommon_Armor_Pen.png",
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

  static imagesUrl: ImagesUrl = {
    hp: "852530378916888626/883344178652786708/Rare_HP_Gem.png",
    strength: "852530378916888626/883346625391648778/Rare_Strength_Gem.png",
    armor: "852530378916888626/883344438317953165/Rare_Armor_Gem.png",
    speed: "852530378916888626/883346375109148702/Uncommon_Speed_Gem.png",
    critRate: "852530378916888626/883348690021015552/Uncommon_Crit_Gem.png",
    critDamage: "852530378916888626/883345971902296114/Rare_crit_Damage_Gem.png",
    armorPenetration: "852530378916888626/883344798784835584/Rare_Armor_Pen_Gem.png",
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

  static imagesUrl: ImagesUrl = {
    hp: "852530378916888626/883344209296392232/Epic_HP_Gem.png",
    strength: "852530378916888626/883346640222687322/Epic_Strength_Gem.png",
    armor: "852530378916888626/883344463538323576/Epic_Armor_Gem.png",
    speed: "852530378916888626/883346412220350484/Epic_Speed_Gem.png",
    critRate: "852530378916888626/883348573616480317/48.png",
    critDamage: "852530378916888626/883346000826224730/Epic_Crit_damage_Gem.png",
    armorPenetration: "852530378916888626/883344859564490763/Epic_Armor_Pen_Gem.png",
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

  static imagesUrl: ImagesUrl = {
    hp: "852530378916888626/883344236035047454/Legendary_HP_Gem.png",
    strength: "852530378916888626/883346658342084629/Legendary_Strength_Gem.png",
    armor: "852530378916888626/883344490046308382/Legendary_Armor_Gem.png",
    speed: "852530378916888626/883346432965365790/Legendary_Speed_Gem.png",
    critRate: "852530378916888626/883348762603454514/Epic_Crit_chance_Gem.png",
    critDamage: "852530378916888626/883346028798046258/Legendary_Crit_Damage_Gem.png",
    armorPenetration: "852530378916888626/883344881634914355/Legendary_Armor_Pen_Gem.png",
  }
}
