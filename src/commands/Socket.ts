import { Message, MessageEmbed } from "discord.js";
import { socketGem } from "../db/gem";
import { ButtonHandler } from "../internals/ButtonHandler";
import Command from "../internals/Command";
import { List } from "../internals/List";
import { Gem } from "../internals/Mining";
import { Player } from "../internals/Player";
import { BLUE_BUTTON, bold, GREEN, inlineCode, RED_BUTTON, WHITE_BUTTON } from "../internals/utils";


export default class Socket extends Command {
  name = "socket";

  async exec(msg: Message, args: string[]) {

    const [quality, arg2] = args;
    const index = parseInt(arg2);

    if (!Gem.isValidQuality(quality))
      return msg.channel.send("invalid Gem quality");
    else if (!index)
      return msg.channel.send("invalid index");
    else if (Number.isNaN(index))
      return msg.channel.send("invalid index");

    const player = await Player.getPlayer(msg.member!);
    const gems = player.inventory.gems.filter(x => x.quality === quality);

    if (gems.length <= 0)
      return msg.channel.send(`You don't have any gem of ${quality} quality`);

    const gemList = List.from(gems).aggregate();
    const selected = gemList[index - 1];

    if (!selected)
      return msg.channel.send(`Cannot find gem`);

    const gem = selected.value;
    const menu = new MessageEmbed()
      .setColor(GREEN)
      .setTitle("Gem Socket")
      .setDescription(`Where do you want to socket ${inlineCode(gem.name)} in?`)

    const button = new ButtonHandler(msg, menu, player.id);

    const buttonHandler = async (btn: string | undefined) => {
      if (!btn) return;

      let pieceName = "";
      switch (btn) {
        case BLUE_BUTTON: pieceName = "helmet"; break;
        case RED_BUTTON: pieceName = "chest"; break;
        case WHITE_BUTTON: pieceName = "pants"; break;
      }

      const piece = player.equippedGears.find(gear => gear.piece === pieceName);

      if (!piece)
        return msg.channel.send("The selected piece must be equipped first");
      else if (piece.gem)
        return msg.channel.send("Selected gear has already gem socketed");

      await socketGem(player.id, gem.id, piece.id);
      
      msg.channel.send(
        `Successfully socketed ${bold(gem.name)} into ${bold(piece.name)}!`
      );
    }

    button.addButton(BLUE_BUTTON, "Helmet", buttonHandler);
    button.addButton(RED_BUTTON, "Chest", buttonHandler);
    button.addButton(WHITE_BUTTON, "Pants", buttonHandler);
    button.addCloseButton();
    await button.run();
  }
}
