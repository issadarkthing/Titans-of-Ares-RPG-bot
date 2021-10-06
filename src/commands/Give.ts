import { Message } from "discord.js";
import { addInventory } from "../db/inventory";
import Command from "../internals/Command";
import { MiningPick } from "../internals/Mining";
import { client } from "../main";

export default class extends Command {
  name = "give";

  async exec(msg: Message, args: string[]) {

    if (
      msg.author.id !== "213585600098467841" &&
      msg.author.id !== client.devID
    ) {
      return;
    }

    const userID = args[0];
    const amount = parseInt(args[1]);

    if (!amount) {
      return msg.channel.send("invalid amount");
    }

    const member = client.mainGuild.members.cache.get(userID);

    if (!member) {
      return msg.channel.send("member not found");
    }

    const pick = new MiningPick();
    await addInventory(member.id, pick.id, amount);

    msg.channel.send(
      `Successfully gave ${amount} mining picks to ${member.displayName}`
    )
  }
}
