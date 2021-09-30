import { Message, MessageEmbed, MessageReaction, User } from "discord.js";
import { BROWN } from "./utils";

interface Button {
  emoji: string;
  label: string;
  callback: (emoji?: string) => void;
}

export class ButtonHandler {
  private buttons: Button[] = [];
  private msgCollector?: Message;
  private msg: Message;
  private embed: MessageEmbed;
  private userID: string;

  constructor(msg: Message, embed: MessageEmbed | string, userID?: string) {
    this.msg = msg;
    this.userID = userID || msg.author.id;
    this.embed = new MessageEmbed();

    if (embed instanceof MessageEmbed) {
      this.embed = new MessageEmbed(embed);
    } else if (typeof embed === "string") {

      const newEmbed = new MessageEmbed()
        .setColor(BROWN)
        .setDescription(embed);

      this.embed = newEmbed;
    }
  }

  private get emojis() {
    return this.buttons.map(x => x.emoji);
  }

  private getCB(key: string) {
    return this.buttons.find(x => x.emoji === key)!.callback;
  }

  private async react() {
    try {
      for (const emoji of this.emojis) {
        await this.msgCollector?.react(emoji);
      }
    // eslint-disable-next-line no-empty
    } catch {}
  }

  private createLabel() {
    return this.buttons.map(x => {
      return `\`${x.emoji} ${x.label}\``
    }).join("\n");
  }

  addButton(emoji: string, label: string, cb: (emoji?: string) => void) {
    this.buttons.push({ 
      emoji,
      label,
      callback: cb,
    });
    return this;
  }

  addCloseButton() {
    this.buttons.push({
      emoji: "❌",
      label: "close this menu",
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      callback: () => {},
    })
  }

  async run() {

    try {
      const filter = (reaction: MessageReaction, user: User) => {
        return this.emojis.includes(reaction.emoji.name) 
          && user.id === this.userID;
      };

      const options = { max: 1, time: 30_000, errors: ['time'] };
      this.embed.addField("---------", this.createLabel());

      this.msgCollector = await this.msg.channel.send(this.embed);

      this.react();
      const collected = await this.msgCollector.awaitReactions(filter, options);
      const reaction = collected.first()!;
      const cb = this.getCB(reaction.emoji.name)!;
      await this.msgCollector.delete();
      cb(reaction.emoji.name);

    } catch {
      this.msgCollector?.delete();
    }
  }
}
