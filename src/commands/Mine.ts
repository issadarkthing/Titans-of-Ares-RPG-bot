import { Message } from "discord.js";
import { ButtonHandler } from "../internals/ButtonHandler";
import Command from "../internals/Command";
import { Player } from "../internals/Player";
import Inventory from "./Inventory";

export default class Mine extends Command {
  name = "mine";
  aliases = ["mining"];

  // eslint-disable-next-line
  async exec(msg: Message, _args: string[]) {

    const player = await Player.getPlayer(msg.member!);
    const miningPick = player.inventory.picks.get(0);

    if (!miningPick) {
      return msg.channel.send("You don't have any mining pick");
    }

    const miningPickCount = player.inventory.all.count(miningPick.id);
    const info = miningPick.show(miningPickCount);
    const menu = new ButtonHandler(msg, info, player.id);
    const inventoryCommand = new Inventory();

    inventoryCommand.handlePick(menu, miningPick, player, msg);

    menu.addCloseButton();
    await menu.run();
  }
}
