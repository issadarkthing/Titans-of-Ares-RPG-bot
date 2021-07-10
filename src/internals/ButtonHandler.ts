import { Message, MessageEmbed, MessageReaction, User } from "discord.js";

interface Button {
  emoji: string;
  label: string;
  callback: () => void;
}

export class ButtonHandler {
  private buttons: Button[] = [];
  private msgCollector?: Message;
  constructor(
    private msg: Message,
    private embed: MessageEmbed,
    private userID: string,
  ) {}

  private get emojis() {
    return this.buttons.map(x => x.emoji);
  }

  private getCB(key: string) {
    return this.buttons.find(x => x.emoji === key)!.callback;
  }

  private async react() {
    for (const emoji of this.emojis) {
      await this.msgCollector?.react(emoji);
    }
  }

  private createLabel() {
    return this.buttons.map(x => {
      return `\`${x.emoji} ${x.label}\``
    }).join("\n");
  }

  addButton(emoji: string, label: string, cb: () => void) {
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

      await this.react();
      const collected = await this.msgCollector.awaitReactions(filter, options);
      const reaction = collected.first()!;
      const cb = this.getCB(reaction.emoji.name)!;
      await this.msgCollector.delete();
      cb();

    } catch {
      this.msgCollector?.delete();
    }
  }
}
