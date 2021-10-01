import { Message, MessageCollector, MessageCollectorOptions, MessageEmbed, TextChannel } from "discord.js";

export class Prompt {
  constructor(private msg: Message) {}

  async collect(
    question: string | MessageEmbed, 
    option?: MessageCollectorOptions,
  ) {

    await this.msg.channel.send(question);

    const filter = (response: Message) => 
      response.author.id === this.msg.author.id;

    const collector = new MessageCollector(
      this.msg.channel as TextChannel, 
      filter,
      { max: 1, time: 60 * 1000, ...option },
    );

    return new Promise<Message>((resolve, reject) => {
      collector.on("end", results => {
        const result = results.first();
        if (!result) {
          reject("no input was given");
          return;
        }

        resolve(result);
      })
    })
  }

  async ask(question: string | MessageEmbed) {
    const respond = await this.collect(question);
    return respond.content;
  }
}
