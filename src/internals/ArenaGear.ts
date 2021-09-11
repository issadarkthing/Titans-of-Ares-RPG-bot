import { oneLine } from "common-tags";
import { Fighter } from "./Fighter";
import { Attributes } from "./Attributes";
import { Gear } from "./Gear";
import { List } from "./List";
import { ArenaScroll } from "./Scroll";
import { roundTo } from "./utils";

export abstract class ArenaGear extends Gear {
  set = "Arena";
  scroll = new ArenaScroll();

  get name() {
    return `${this.set} ${this.constructor.name}`;
  }

  get id() {
    const pieceName = this.constructor.name.toLowerCase();
    return `${super.id}_arena_${pieceName}`;
  }

  static get all(): List<ArenaGear> {
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

  bonus(gears: List<Gear>) {

    let bonus = 0;
    switch (true) {
      case this.isBonus(gears, 10): bonus = 0.6; break;
      case this.isBonus(gears, 5): bonus = 0.4; break;
      case this.isBonus(gears, 0): bonus = 0.2; break;
      default: return;
    }

    const description =
      oneLine`${this.set} Set Armor Penetration \`Armor Penetration +${bonus * 100}%\``;

    return { bonus, description };
  }
}

export class Helmet extends ArenaGear {
  socketable = true;
  baseStat = 1.5;
  price = 30;

  get description() {
    return `+${roundTo(this.increment, 1)} Armor`;
  }

  use(fighter: Fighter) {
    fighter.armor += this.increment;
    return { attrib: Attributes.armor, amount: this.increment };
  }
}


export class Amulet extends ArenaGear {
  baseStat = 150;
  price = 40;

  get description() {
    return `+${Math.round(this.increment)} HP`;
  }

  use(fighter: Fighter) {
    fighter.hp += this.increment;
    return { attrib: Attributes.hp, amount: this.increment };
  }
}

export class Chest extends ArenaGear {
  socketable = true;
  baseStat = 1.8;
  price = 50;

  get description() {
    return `+${roundTo(this.increment, 1)} Armor`;
  }

  use(fighter: Fighter) {
    fighter.armor += this.increment;
    return { attrib: Attributes.armor, amount: this.increment };
  }
}

export class Pants extends ArenaGear {
  socketable = true;
  baseStat = 1.7;
  price = 46;

  get description() {
    return `+${roundTo(this.increment, 1)} Armor`;
  }

  use(fighter: Fighter) {
    fighter.armor += this.increment;
    return { attrib: Attributes.armor, amount: this.increment };
  }
}

export class Boots extends ArenaGear {
  baseStat = 30;
  price = 26;

  get description() {
    return `+${Math.round(this.increment)} Speed`;
  }

  use(fighter: Fighter) {
    fighter.speed += this.increment;
    return { attrib: Attributes.speed, amount: this.increment };
  }
}

export class Gauntlets extends ArenaGear {
  baseStat = 0.7;
  price = 26;

  get description() {
    return `+${roundTo(this.increment, 1)} Armor`;
  }

  use(fighter: Fighter) {
    fighter.armor += this.increment;
    return { attrib: Attributes.armor, amount: this.increment };
  }
}

export class Belt extends ArenaGear {
  baseStat = 0.5;
  price = 16;

  get description() {
    return `+${roundTo(this.increment, 1)} Armor`;
  }

  use(fighter: Fighter) {
    fighter.armor += this.increment;
    return { attrib: Attributes.armor, amount: this.increment };
  }
}

export class Wrist extends ArenaGear {
  baseStat = 0.5;
  price = 16;

  get description() {
    return `+${roundTo(this.increment, 1)} Armor`;
  }

  use(fighter: Fighter) {
    fighter.armor += this.increment;
    return { attrib: Attributes.armor, amount: this.increment };
  }
}


export class LeftRing extends ArenaGear {
  baseStat = 0.015;
  price = 40;

  get description() {
    return `+${roundTo(this.increment * 100, 1)}% Crit Rate`;
  }

  use(fighter: Fighter) {
    fighter.critRate += this.increment;
    return { attrib: Attributes.critRate, amount: this.increment };
  }
}

export class RightRing extends ArenaGear {
  baseStat = 0.15;
  price = 40;

  get description() {
    return `+${roundTo(this.increment, 2)} Crit Dmg`;
  }

  use(fighter: Fighter) {
    fighter.critDamage += this.increment;
    return { attrib: Attributes.critDamage, amount: this.increment };
  }
}

export class Sword extends ArenaGear {
  baseStat = 30;
  price = 100;

  get description() {
    return `+${roundTo(this.increment, 2)} Strength`;
  }

  use(fighter: Fighter) {
    fighter.strength += this.increment;
    return { attrib: Attributes.strength, amount: this.increment };
  }
}
