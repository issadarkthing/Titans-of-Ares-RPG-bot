import { MessageEmbed } from "discord.js";
import { Gear as GearDB } from "../db/gear";
import { Fighter, Attributes } from "./Fighter";
import { Item } from "./Item";
import { List } from "./List";
import { BROWN, CDN_LINK, GOLD, random } from "./utils";

export interface GearBonus {
  description: string;
  bonus: number;
}


export abstract class Gear extends Item {
  abstract name: string;
  abstract use(fighter: Fighter): { attrib: Attributes, amount: number };
  abstract description: string;
  abstract price: number;
  abstract set: string;
  abstract baseStat: number;
  abstract bonus(gears: List<Gear>): GearBonus | undefined;
  equipped = false;
  upgradeAnimationUrl = CDN_LINK + "852530378916888626/867765847312826398/image0.gif";
  level = 0;

  get id() {
    return `gear`;
  }

  get multiplier() {
    return 0.2 * this.level;
  }

  get increment() {
    return this.baseStat + this.baseStat * this.multiplier;
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

  static fromDB(gear: GearDB) {
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

  protected isBonus(gears: List<Gear>, minLevel: number) {
    return gears.length === 11 && 
      gears.every(gear => {
        const passMinGear = gear.level >= minLevel;
        const sameGearSet = gear.set === this.set;
        return passMinGear && sameGearSet;
      });
  }

  /** returns magnitude of bonus */
  static getBonus(gears: List<Gear>) {
    const gear = gears.get(0);
    return gear?.bonus(gears);
  }
}
