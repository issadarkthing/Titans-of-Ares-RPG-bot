import { MessageEmbed } from "discord.js";
import { Fighter } from "./Fighter";
import { Item } from "./Item";
import { List } from "./List";
import { BROWN, CDN_LINK, GOLD, random, roundTo } from "./utils";
import { Gear as GearDB } from "../db/gear";
import { oneLine } from "common-tags";

export abstract class Gear extends Item {
  abstract name: string;
  abstract use(fighter: Fighter): { attrib: string, amount: number };
  abstract description: string;
  abstract price: number;
  abstract set: string;
  abstract baseStat: number;
  abstract bonus(gears: Gear[]): number;
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
    return List.from([
      ...Apprentice.all,
    ])
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
      .addField("Price", this.price, true)
      .addField("Upgrade Scrolls", scroll, true)
      .addField("Level", this.level, true)

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
}

export abstract class Apprentice extends Gear {
  set = "Apprentice";
  reflectAnimationUrl = CDN_LINK + 
    "852530378916888626/868442912294309898/3o7WTqRKlVRj0wsYQo.gif";

  get name() {
    return `${this.set} ${this.constructor.name}`;
  }

  static get all(): List<Apprentice> {
    return List.from([
      new Helmet(),
      new Amulet(),
      new Chest(),
      new Pants(),
      new Boots(),
      new Gauntlets(),
      new Belt(),
      new Wrist(),
      new LeftRing(),
      new RightRing(),
      new Sword(),
    ]);
  }

  bonus(gears: Gear[]) {

    const isBonus = (minLevel: number) => 
      gears.length === 11 && 
        gears.every(gear => (gear instanceof Apprentice) 
          && gear.level >= minLevel);

    switch (true) {
      case isBonus(10):
        return 0.5;
      case isBonus(5):
        return 0.3;
      case isBonus(0):
        return 0.1;
      default:
        return 0;
    }
  }

  reflectAnimation(playerName: string, damage: number, bonus: number) {
    const embed = new MessageEmbed()
      .setColor(GOLD)
      .setTitle(`${this.set} Set Reflect Skill`)
      .setImage(this.reflectAnimationUrl)
      .setDescription(
        oneLine`${playerName} reflected \`${Math.round(damage)} damage (${bonus * 100}%)\``
      )

    return embed;
  }

  get id() {
    const pieceName = this.constructor.name.toLowerCase();
    return `${super.id}_apprentice_${pieceName}`;
  }
}

export class Helmet extends Apprentice {
  baseStat = 1;
  price = 150;

  get description() {
    return `+${roundTo(this.increment, 1)} Armor`;
  }

  use(fighter: Fighter) {
    fighter.armor += this.increment;
    return { attrib: "Armor", amount: this.increment };
  }
}

export class Amulet extends Apprentice {
  baseStat = 100;
  price = 200;

  get description() {
    return `+${Math.round(this.increment)} HP`;
  }

  use(fighter: Fighter) {
    fighter.hp += this.increment;
    return { attrib: "HP", amount: this.increment };
  }
}

export class Chest extends Apprentice {
  baseStat = 1.2;
  price = 250;

  get description() {
    return `+${roundTo(this.increment, 1)} Armor`;
  }

  use(fighter: Fighter) {
    fighter.armor += this.increment;
    return { attrib: "Armor", amount: this.increment };
  }
}

export class Pants extends Apprentice {
  baseStat = 1.15;
  price = 225;

  get description() {
    return `+${roundTo(this.increment, 1)} Armor`;
  }

  use(fighter: Fighter) {
    fighter.armor += this.increment;
    return { attrib: "Armor", amount: this.increment };
  }
}

export class Boots extends Apprentice {
  baseStat = 20;
  price = 125;

  get description() {
    return `+${Math.round(this.increment)} Speed`;
  }

  use(fighter: Fighter) {
    fighter.speed += this.increment;
    return { attrib: "Speed", amount: this.increment };
  }
}

export class Gauntlets extends Apprentice {
  baseStat = 0.5;
  price = 125;

  get description() {
    return `+${roundTo(this.increment, 1)} Armor`;
  }

  use(fighter: Fighter) {
    fighter.armor += this.increment;
    return { attrib: "Armor", amount: this.increment };
  }
}

export class Belt extends Apprentice {
  baseStat = 0.3;
  price = 75;

  get description() {
    return `+${roundTo(this.increment, 1)} Armor`;
  }

  use(fighter: Fighter) {
    fighter.armor += this.increment;
    return { attrib: "Armor", amount: this.increment };
  }
}

export class Wrist extends Apprentice {
  baseStat = 0.3;
  price = 75;

  get description() {
    return `+${roundTo(this.increment, 1)} Armor`;
  }

  use(fighter: Fighter) {
    fighter.armor += this.increment;
    return { attrib: "Armor", amount: this.increment };
  }
}

export class LeftRing extends Apprentice {
  baseStat = 0.01;
  price = 200;

  get name() {
    return `${this.set} Left Ring`;
  }

  get description() {
    return `+${roundTo(this.increment * 100, 1)}% Crit Rate`;
  }

  use(fighter: Fighter) {
    fighter.critRate += this.increment;
    return { attrib: "Crit Rate", amount: this.increment };
  }
}

export class RightRing extends Apprentice {
  baseStat = 0.1;
  price = 200;

  get name() {
    return `${this.set} Right Ring`;
  }

  get description() {
    return `+${roundTo(this.increment, 2)} Crit Dmg`;
  }

  use(fighter: Fighter) {
    fighter.critDamage += this.increment;
    return { attrib: "Crit Damage", amount: this.increment };
  }
}

export class Sword extends Apprentice {
  baseStat = 10;
  price = 500;

  get description() {
    return `+${Math.round(this.increment)} Strength`;
  }

  use(fighter: Fighter) {
    fighter.strength += this.increment;
    return { attrib: "Strength", amount: this.increment };
  }
}
