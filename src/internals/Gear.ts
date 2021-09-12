import { MessageEmbed } from "discord.js";
import { Gear as GearDB } from "../db/gear";
import { Fighter } from "./Fighter";
import { Attribute } from "./Attributes";
import { Item } from "./Item";
import { List } from "./List";
import { Gem } from "./Mining";
import { Scroll } from "./Scroll";
import { BROWN, CDN_LINK, GOLD, inlineCode, random } from "./utils";

export interface GearBonus {
  description: string;
  bonus: number;
}

export interface Socketable {
  gem?: Gem;
  socketable: boolean;
}

export abstract class Gear extends Item implements Socketable {
  abstract name: string;
  abstract price: number;
  abstract set: string;
  abstract baseStat: number;
  abstract bonus(gears: List<Gear>): GearBonus | undefined;
  abstract attribute: Attribute;
  gem?: Gem;
  socketable = false;
  scroll = new Scroll();
  equipped = false;
  upgradeAnimationUrl = CDN_LINK + "852530378916888626/867765847312826398/image0.gif";
  level = 0;

  get id() {
    return `gear`;
  }

  get multiplier() {
    return 0.2 * this.level;
  }

  get attributeValue() {
    return this.baseStat + this.baseStat * this.multiplier;
  }

  get description() {
    return this.attribute.format(this.attributeValue);
  }

  static get all() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ApprenticeGear } = require("./ApprenticeGear");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ArenaGear } = require("./ArenaGear");

    return List.from([
      ...ApprenticeGear.all,
      ...ArenaGear.all,
    ]);
  }

  static fromID(id: string) {
    return Gear.all.get(id)!;
  }

  static fromDB(gear: GearDB): Gear {
    const g = Gear.fromID(gear.ItemID)!;
    g.level = gear.Level;
    g.equipped = gear.Equipped;
    return g;
  }

  get upgradeChance() {
    switch (this.level) {
      case 0: return 1;
      case 1: return 0.9;
      case 2: return 0.8;
      case 3: return 0.7;
      case 4: return 0.5;
      case 5: return 0.45;
      case 6: return 0.2;
      case 7: return 0.05;
      case 8: return 0.02;
      case 9: return 0.005;
      default: return 0;
    }
  }

  use(fighter: Fighter) {
    fighter[this.attribute.key] += this.attributeValue;
  }

  show(count: number): MessageEmbed {
    const embed = new MessageEmbed()
      .setColor(BROWN)
      .setTitle(this.name)
      .setDescription(`\`${this.description}\``)
      .addField("Price", this.price, true)
      .addField("Owned", count > 0 ? "yes" : "no", true)
      .addField("Level", this.level, true)

    return embed;
  }

  inspect(scroll: number) {
    const embed = new MessageEmbed()
      .setColor(BROWN)
      .setTitle(this.name)
      .setDescription(`\`${this.description}\``)
      .addField("Upgrade Scrolls", scroll, true)
      .addField("Level", this.level == 10 ? "max" : this.level, true)

    if (this.gem) {
      embed.addField("Socketed Gem", inlineCode(this.gem.name), true);
    }

    return embed;
  }

  upgradeAnimation() {
    const embed = new MessageEmbed()
      .setColor(GOLD)
      .setTitle(`Upgrading ${this.name}`)
      .setImage(this.upgradeAnimationUrl)

    return embed;
  }

  /** returns true if upgrade successfull */
  upgrade() {
    return random().bool(this.upgradeChance);
  }

  /** 
   * gets the piece name
   * @example "Arena Helmet" -> "helmet"
   * */
  get piece() {
    return this.constructor.name.toLowerCase();
  }

  protected isBonus(gears: List<Gear>, minLevel: number) {
    const set = this.set;
    return gears.length === 11 && 
      gears.every(gear => {
        const passMinGear = gear.level >= minLevel;
        const sameGearSet = gear.set === set;
        return passMinGear && sameGearSet;
      });
  }

  /** returns magnitude of bonus */
  static getBonus(gears: List<Gear>) {
    const gear = gears.get(0);
    return gear?.bonus(gears);
  }
}
