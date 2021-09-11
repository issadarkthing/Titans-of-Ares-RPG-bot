import { oneLine } from "common-tags";
import { MessageEmbed } from "discord.js";
import { Attributes } from "./Attributes";
import { Fighter } from "./Fighter";
import { Gear } from "./Gear";
import { List } from "./List";
import { CDN_LINK, GOLD, roundTo } from "./utils";

export abstract class ApprenticeGear extends Gear {
  set = "Apprentice";
  reflectAnimationUrl = CDN_LINK + 
    "852530378916888626/868442912294309898/3o7WTqRKlVRj0wsYQo.gif";

  get name() {
    return `${this.set} ${this.constructor.name}`;
  }

  static get all(): List<ApprenticeGear> {
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
      case this.isBonus(gears, 10): bonus = 0.5; break;
      case this.isBonus(gears, 5): bonus = 0.3; break;
      case this.isBonus(gears, 0): bonus = 0.1; break;
      default: return;
    }

    const description =
      oneLine`${this.set} Set Reflect Skill \`Reflect ${bonus * 100}% of
      opponents first attack\``;

    return { bonus, description };
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

export class Helmet extends ApprenticeGear {
  attribute = Attributes.armor;
  socketable = true;
  baseStat = 1;
  price = 150;

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

export class Amulet extends ApprenticeGear {
  attribute = Attributes.hp;
  baseStat = 100;
  price = 200;

  get description() {
    return `+${Math.round(this.attributeValue)} HP`;
  }

  use(fighter: Fighter) {
    fighter.hp += this.attributeValue;
    return { attrib: Attributes.hp, amount: this.attributeValue };
  }
}

export class Chest extends ApprenticeGear {
  attribute = Attributes.armor;
  socketable = true;
  baseStat = 1.2;
  price = 250;

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

export class Pants extends ApprenticeGear {
  attribute = Attributes.armor;
  socketable = true;
  baseStat = 1.15;
  price = 225;

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

export class Boots extends ApprenticeGear {
  attribute = Attributes.speed;
  baseStat = 20;
  price = 125;

  get description() {
    return `+${Math.round(this.attributeValue)} Speed`;
  }

  use(fighter: Fighter) {
    fighter.speed += this.attributeValue;
    return { attrib: Attributes.speed, amount: this.attributeValue };
  }
}

export class Gauntlets extends ApprenticeGear {
  attribute = Attributes.armor;
  baseStat = 0.5;
  price = 125;

  get description() {
    return `+${roundTo(this.attributeValue, 1)} Armor`;
  }

  use(fighter: Fighter) {
    fighter.armor += this.attributeValue;
    return { attrib: Attributes.armor, amount: this.attributeValue };
  }
}

export class Belt extends ApprenticeGear {
  attribute = Attributes.armor;
  baseStat = 0.3;
  price = 75;

  get description() {
    return `+${roundTo(this.attributeValue, 1)} Armor`;
  }

  use(fighter: Fighter) {
    fighter.armor += this.attributeValue;
    return { attrib: Attributes.armor, amount: this.attributeValue };
  }
}

export class Wrist extends ApprenticeGear {
  attribute = Attributes.armor;
  baseStat = 0.3;
  price = 75;

  get description() {
    return `+${roundTo(this.attributeValue, 1)} Armor`;
  }

  use(fighter: Fighter) {
    fighter.armor += this.attributeValue;
    return { attrib: Attributes.armor, amount: this.attributeValue };
  }
}

export class LeftRing extends ApprenticeGear {
  attribute = Attributes.critRate;
  baseStat = 0.01;
  price = 200;

  get name() {
    return `${this.set} Left Ring`;
  }

  get description() {
    return `+${roundTo(this.attributeValue * 100, 1)}% Crit Rate`;
  }

  use(fighter: Fighter) {
    fighter.critRate += this.attributeValue;
    return { attrib: Attributes.critRate, amount: this.attributeValue };
  }
}

export class RightRing extends ApprenticeGear {
  attribute = Attributes.critDamage;
  baseStat = 0.1;
  price = 200;

  get name() {
    return `${this.set} Right Ring`;
  }

  get description() {
    return `+${roundTo(this.attributeValue, 2)} Crit Dmg`;
  }

  use(fighter: Fighter) {
    fighter.critDamage += this.attributeValue;
    return { attrib: Attributes.critDamage, amount: this.attributeValue };
  }
}

export class Sword extends ApprenticeGear {
  attribute = Attributes.strength;
  baseStat = 20;
  price = 500;

  get description() {
    return `+${Math.round(this.attributeValue)} Strength`;
  }

  use(fighter: Fighter) {
    fighter.strength += this.attributeValue;
    return { attrib: Attributes.strength, amount: this.attributeValue };
  }
}
