import { Message } from "discord.js";
import { addGem, setMiningPickReward } from "../db/gem";
import Command from "../internals/Command";
import { Legendary } from "../internals/Mining";
import { MiningPickReward } from "../internals/MiningPickReward";
import { Player } from "../internals/Player";
import { client } from "../main";


export default class extends Command {
  name = "test";
  aliases = ["t"]

  async exec(msg: Message, args: string[]) {

    const [arg1] = args;

    // reset MiningPickReward column
    if (arg1 === "db" && msg.author.id === client.devID) {
      client.runEveryPlayer(async player => {
        const limit = MiningPickReward.upperLimit(player.xp);
        console.log(player.id, player.xp, limit);
        await setMiningPickReward(player.id, limit);
      });

      return;
    }

    if (!client.isDev) return;

    const player = await Player.getPlayer(msg.member!);

    for (let i = 0; i < 10; i++) {
      const gem = Legendary.random();
      await addGem(player.id, gem.id);
      await msg.channel.send(`You got ${gem.name}!`);
      await msg.channel.send(gem.show(-1));
    }
  }
}
