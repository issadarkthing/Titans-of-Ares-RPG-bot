import { oneLine } from "common-tags";
import { Attributes } from "./Attributes";
import { Gear } from "./Gear";
import { List } from "./List";
import { ArenaScroll } from "./Scroll";

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
}


export class Amulet extends ArenaGear {
  attribute = Attributes.hp;
  baseStat = 150;
  price = 40;
}

export class Chest extends ArenaGear {
  attribute = Attributes.armor;
  socketable = true;
  baseStat = 1.8;
  price = 50;
}

export class Pants extends ArenaGear {
  attribute = Attributes.armor;
  socketable = true;
  baseStat = 1.7;
  price = 46;
}

export class Boots extends ArenaGear {
  attribute = Attributes.speed;
  baseStat = 30;
  price = 26;
}

export class Gauntlets extends ArenaGear {
  attribute = Attributes.armor;
  baseStat = 0.7;
  price = 26;
}

export class Belt extends ArenaGear {
  attribute = Attributes.armor;
  baseStat = 0.5;
  price = 16;
}

export class Wrist extends ArenaGear {
  attribute = Attributes.armor;
  baseStat = 0.5;
  price = 16;
}


export class LeftRing extends ArenaGear {
  attribute = Attributes.critRate;
  baseStat = 0.015;
  price = 40;
}

export class RightRing extends ArenaGear {
  attribute = Attributes.critDamage;
  baseStat = 0.15;
  price = 40;
}

export class Sword extends ArenaGear {
  attribute = Attributes.strength;
  baseStat = 30;
  price = 100;
}
