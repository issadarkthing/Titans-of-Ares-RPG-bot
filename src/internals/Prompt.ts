import { Message, MessageCollector, MessageCollectorOptions, MessageEmbed, TextChannel } from "discord.js";

type PromptOptions = MessageCollectorOptions & {
  cancelKeyword?: string[],
};

export class EmptyInputError extends Error {
  constructor() {
    super("no input was given");
  }
}

export class CancelledInputError extends Error {
  constructor() {
    super("cancelled input");
  }
}

export class Prompt {
  constructor(
    private msg: Message,
    private options?: PromptOptions,
  ) {}

  async collect(
    question: string | MessageEmbed,
    options?: PromptOptions,
  ) {

    options = { ...this.options, ...options };
    await this.msg.channel.send(question);

    const filter = (response: Message) =>
      response.author.id === this.msg.author.id

    const collector = new MessageCollector(
      this.msg.channel as TextChannel,
      filter,
      { max: 1, time: 60 * 1000, ...options },
    );

    return new Promise<Message>((resolve, reject) => {

      collector.on("collect", (result: Message) => {
        if (options && options.cancelKeyword?.includes(result.content)) {
          reject(new CancelledInputError());
        }
      })

      collector.on("end", results => {
        const result = results.first();
        if (!result) {
          reject(new EmptyInputError());
          return;
        }

        resolve(result);
      })
    })
  }

  async ask(question: string | MessageEmbed, option?: PromptOptions) {
    const respond = await this.collect(question, option);
    return respond.content;
  }
}
