import { oneLine } from "common-tags";
import { Attributes, Fighter } from "./Fighter";
import { Gear, GearBonus } from "./Gear";
import { List } from "./List";
import { roundTo } from "./utils";

export abstract class Arena extends Gear {
  set = "Arena";

  get name() {
    return `${this.set} ${this.constructor.name}`;
  }

  get id() {
    const pieceName = this.constructor.name.toLowerCase();
    return `${super.id}_arena_${pieceName}`;
  }

  static get all(): List<Arena> {
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
      new Claymore(),
    ]);
  }

  bonus(gears: List<Gear>): GearBonus {

    const isBonus = (minLevel: number) => 
      gears.length === 11 && 
        gears.every(gear => (gear instanceof Arena) 
          && gear.level >= minLevel);

    let bonus = 0;
    switch (true) {
      case isBonus(10): bonus = 0.4; break;
      case isBonus(5): bonus = 0.3; break;
      case isBonus(0): bonus = 0.2; break;
    }

    const description =
      oneLine`${this.set} Set Penetration Skill \`Penetrate ${bonus * 100}% of
      opponents first attack\``;

    return { bonus, description };
  }
}

export class Helmet extends Arena {
  baseStat = 1.5;
  price = 30;

  get description() {
    return `+${roundTo(this.increment, 1)} Armor`;
  }

  use(fighter: Fighter) {
    fighter.armor += this.increment;
    return { attrib: Attributes.ARMOR, amount: this.increment };
  }
}


export class Amulet extends Arena {
  baseStat = 150;
  price = 40;

  get description() {
    return `+${Math.round(this.increment)} HP`;
  }

  use(fighter: Fighter) {
    fighter.hp += this.increment;
    return { attrib: Attributes.HP, amount: this.increment };
  }
}

export class Chest extends Arena {
  baseStat = 1.8;
  price = 50;

  get description() {
    return `+${roundTo(this.increment, 1)} Armor`;
  }

  use(fighter: Fighter) {
    fighter.armor += this.increment;
    return { attrib: Attributes.ARMOR, amount: this.increment };
  }
}

export class Pants extends Arena {
  baseStat = 1.7;
  price = 46;

  get description() {
    return `+${roundTo(this.increment, 1)} Armor`;
  }

  use(fighter: Fighter) {
    fighter.armor += this.increment;
    return { attrib: Attributes.ARMOR, amount: this.increment };
  }
}

export class Boots extends Arena {
  baseStat = 30;
  price = 26;

  get description() {
    return `+${Math.round(this.increment)} Speed`;
  }

  use(fighter: Fighter) {
    fighter.speed += this.increment;
    return { attrib: Attributes.SPEED, amount: this.increment };
  }
}

export class Gauntlets extends Arena {
  baseStat = 0.7;
  price = 26;

  get description() {
    return `+${roundTo(this.increment, 1)} Armor`;
  }

  use(fighter: Fighter) {
    fighter.armor += this.increment;
    return { attrib: Attributes.ARMOR, amount: this.increment };
  }
}

export class Belt extends Arena {
  baseStat = 0.5;
  price = 16;

  get description() {
    return `+${roundTo(this.increment, 1)} Armor`;
  }

  use(fighter: Fighter) {
    fighter.armor += this.increment;
    return { attrib: Attributes.ARMOR, amount: this.increment };
  }
}

export class Wrist extends Arena {
  baseStat = 0.5;
  price = 16;

  get description() {
    return `+${roundTo(this.increment, 1)} Armor`;
  }

  use(fighter: Fighter) {
    fighter.armor += this.increment;
    return { attrib: Attributes.ARMOR, amount: this.increment };
  }
}


export class LeftRing extends Arena {
  baseStat = 0.015;
  price = 40;

  get description() {
    return `+${roundTo(this.increment * 100, 1)}% Crit Rate`;
  }

  use(fighter: Fighter) {
    fighter.critRate += this.increment;
    return { attrib: Attributes.CRIT_RATE, amount: this.increment };
  }
}

export class RightRing extends Arena {
  baseStat = 0.15;
  price = 40;

  get description() {
    return `+${roundTo(this.increment, 2)} Crit Dmg`;
  }

  use(fighter: Fighter) {
    fighter.critDamage += this.increment;
    return { attrib: Attributes.CRIT_DAMAGE, amount: this.increment };
  }
}

export class Claymore extends Arena {
  baseStat = 30;
  price = 100;

  get description() {
    return `+${roundTo(this.increment, 2)} Strength`;
  }

  use(fighter: Fighter) {
    fighter.strength += this.increment;
    return { attrib: Attributes.STRENGTH, amount: this.increment };
  }
}
