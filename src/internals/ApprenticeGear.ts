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
  baseStat = 1;
  price = 150;

  get description() {
    return `+${roundTo(this.increment, 1)} Armor`;
  }

  use(fighter: Fighter) {
    fighter.armor += this.increment;
    return { attrib: Attributes.armor, amount: this.increment };
  }
}

export class Amulet extends ApprenticeGear {
  baseStat = 100;
  price = 200;

  get description() {
    return `+${Math.round(this.increment)} HP`;
  }

  use(fighter: Fighter) {
    fighter.hp += this.increment;
    return { attrib: Attributes.hp, amount: this.increment };
  }
}

export class Chest extends ApprenticeGear {
  baseStat = 1.2;
  price = 250;

  get description() {
    return `+${roundTo(this.increment, 1)} Armor`;
  }

  use(fighter: Fighter) {
    fighter.armor += this.increment;
    return { attrib: Attributes.armor, amount: this.increment };
  }
}

export class Pants extends ApprenticeGear {
  baseStat = 1.15;
  price = 225;

  get description() {
    return `+${roundTo(this.increment, 1)} Armor`;
  }

  use(fighter: Fighter) {
    fighter.armor += this.increment;
    return { attrib: Attributes.armor, amount: this.increment };
  }
}

export class Boots extends ApprenticeGear {
  baseStat = 20;
  price = 125;

  get description() {
    return `+${Math.round(this.increment)} Speed`;
  }

  use(fighter: Fighter) {
    fighter.speed += this.increment;
    return { attrib: Attributes.speed, amount: this.increment };
  }
}

export class Gauntlets extends ApprenticeGear {
  baseStat = 0.5;
  price = 125;

  get description() {
    return `+${roundTo(this.increment, 1)} Armor`;
  }

  use(fighter: Fighter) {
    fighter.armor += this.increment;
    return { attrib: Attributes.armor, amount: this.increment };
  }
}

export class Belt extends ApprenticeGear {
  baseStat = 0.3;
  price = 75;

  get description() {
    return `+${roundTo(this.increment, 1)} Armor`;
  }

  use(fighter: Fighter) {
    fighter.armor += this.increment;
    return { attrib: Attributes.armor, amount: this.increment };
  }
}

export class Wrist extends ApprenticeGear {
  baseStat = 0.3;
  price = 75;

  get description() {
    return `+${roundTo(this.increment, 1)} Armor`;
  }

  use(fighter: Fighter) {
    fighter.armor += this.increment;
    return { attrib: Attributes.armor, amount: this.increment };
  }
}

export class LeftRing extends ApprenticeGear {
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
    return { attrib: Attributes.critRate, amount: this.increment };
  }
}

export class RightRing extends ApprenticeGear {
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
    return { attrib: Attributes.critDamage, amount: this.increment };
  }
}

export class Sword extends ApprenticeGear {
  baseStat = 20;
  price = 500;

  get description() {
    return `+${Math.round(this.increment)} Strength`;
  }

  use(fighter: Fighter) {
    fighter.strength += this.increment;
    return { attrib: Attributes.strength, amount: this.increment };
  }
}
