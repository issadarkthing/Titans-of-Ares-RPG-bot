import { MessageEmbed } from "discord.js";
import { Fighter } from "./Fighter";
import { Item } from "./Item";
import { List } from "./List";
import { BROWN, random, roundTo } from "./utils";


export abstract class Armor extends Item {
  abstract name: string;
  abstract use(fighter: Fighter): void;
  abstract description: string;
  abstract price: number;
  abstract set: string;
  abstract baseStat: number;
  level = 0;

  get id() {
    return `armor`;
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
      .setDescription(this.description)
      .addField("Count", count)

    return embed;
  }

  /** returns true if upgrade successfull */
  upgrade() {
    return random().bool(this.upgradeChance);
  }
}

abstract class Apprentice extends Armor {
  set = "Apprentice";

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

  get id() {
    const pieceName = this.constructor.name.toLowerCase();
    return `${super.id}_apprentice_${pieceName}_${this.level}`;
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
  }
}

export class LeftRing extends Apprentice {
  baseStat = 1;
  price = 200;

  get description() {
    return `+${roundTo(this.increment, 2)} Crit Rate`;
  }

  use(fighter: Fighter) {
    fighter.critRate += this.increment;
  }
}

export class RightRing extends Apprentice {
  baseStat = 0.1;
  price = 200;

  get description() {
    return `+${roundTo(this.increment, 2)} Crit Damage`;
  }

  use(fighter: Fighter) {
    fighter.critDamage += this.increment;
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
  }
}
