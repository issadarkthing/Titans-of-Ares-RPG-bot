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
  attribute = Attributes.armor;
  socketable = true;
  baseStat = 1.5;
  price = 30;

  get description() {
    let stat = this.attributeValue;

    if (this.gem?.attribute.key === "armor") {
      stat += this.gem.attributeValue;
    }

    const desc = `+${roundTo(stat, 1)} Armor`;

    if (this.gem) {
      return desc + ` | ${this.gem.stat}`;
    }

    return desc;
  }

  use(fighter: Fighter) {
    fighter.armor += this.attributeValue;
    return { attrib: Attributes.armor, amount: this.attributeValue };
  }
}


export class Amulet extends ArenaGear {
  attribute = Attributes.hp;
  baseStat = 150;
  price = 40;

  get description() {
    return `+${Math.round(this.attributeValue)} HP`;
  }

  use(fighter: Fighter) {
    fighter.hp += this.attributeValue;
    return { attrib: Attributes.hp, amount: this.attributeValue };
  }
}

export class Chest extends ArenaGear {
  attribute = Attributes.armor;
  socketable = true;
  baseStat = 1.8;
  price = 50;

  get description() {
    let stat = this.attributeValue;

    if (this.gem?.attribute.key === "armor") {
      stat += this.gem.attributeValue;
    }

    const desc = `+${roundTo(stat, 1)} Armor`;

    if (this.gem) {
      return desc + ` | ${this.gem.stat}`;
    }

    return desc;
  }

  use(fighter: Fighter) {
    fighter.armor += this.attributeValue;
    return { attrib: Attributes.armor, amount: this.attributeValue };
  }
}

export class Pants extends ArenaGear {
  attribute = Attributes.armor;
  socketable = true;
  baseStat = 1.7;
  price = 46;

  get description() {
    const desc = `+${roundTo(this.attributeValue, 1)} Armor`;

    if (this.gem) {
      return desc + ` | ${this.gem.stat}`;
    }

    return desc;
  }

  use(fighter: Fighter) {
    fighter.armor += this.attributeValue;
    return { attrib: Attributes.armor, amount: this.attributeValue };
  }
}

export class Boots extends ArenaGear {
  attribute = Attributes.speed;
  baseStat = 30;
  price = 26;

  get description() {
    return `+${Math.round(this.attributeValue)} Speed`;
  }

  use(fighter: Fighter) {
    fighter.speed += this.attributeValue;
    return { attrib: Attributes.speed, amount: this.attributeValue };
  }
}

export class Gauntlets extends ArenaGear {
  attribute = Attributes.armor;
  baseStat = 0.7;
  price = 26;

  get description() {
    return `+${roundTo(this.attributeValue, 1)} Armor`;
  }

  use(fighter: Fighter) {
    fighter.armor += this.attributeValue;
    return { attrib: Attributes.armor, amount: this.attributeValue };
  }
}

export class Belt extends ArenaGear {
  attribute = Attributes.armor;
  baseStat = 0.5;
  price = 16;

  get description() {
    return `+${roundTo(this.attributeValue, 1)} Armor`;
  }

  use(fighter: Fighter) {
    fighter.armor += this.attributeValue;
    return { attrib: Attributes.armor, amount: this.attributeValue };
  }
}

export class Wrist extends ArenaGear {
  attribute = Attributes.armor;
  baseStat = 0.5;
  price = 16;

  get description() {
    return `+${roundTo(this.attributeValue, 1)} Armor`;
  }

  use(fighter: Fighter) {
    fighter.armor += this.attributeValue;
    return { attrib: Attributes.armor, amount: this.attributeValue };
  }
}


export class LeftRing extends ArenaGear {
  attribute = Attributes.critRate;
  baseStat = 0.015;
  price = 40;

  get description() {
    return `+${roundTo(this.attributeValue * 100, 1)}% Crit Rate`;
  }

  use(fighter: Fighter) {
    fighter.critRate += this.attributeValue;
    return { attrib: Attributes.critRate, amount: this.attributeValue };
  }
}

export class RightRing extends ArenaGear {
  attribute = Attributes.critDamage;
  baseStat = 0.15;
  price = 40;

  get description() {
    return `+${roundTo(this.attributeValue, 2)} Crit Dmg`;
  }

  use(fighter: Fighter) {
    fighter.critDamage += this.attributeValue;
    return { attrib: Attributes.critDamage, amount: this.attributeValue };
  }
}

export class Sword extends ArenaGear {
  attribute = Attributes.strength;
  baseStat = 30;
  price = 100;

  get description() {
    return `+${roundTo(this.attributeValue, 2)} Strength`;
  }

  use(fighter: Fighter) {
    fighter.strength += this.attributeValue;
    return { attrib: Attributes.strength, amount: this.attributeValue };
  }
}
