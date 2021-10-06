import { Message } from "discord.js";
import { setMiningPickReward } from "../db/gem";
import { addXP } from "../db/xp";
import Command from "../internals/Command";
import { List } from "../internals/List";
import { Gem, Stone } from "../internals/Mining";
import { MiningPickReward } from "../internals/MiningPickReward";
import { Player } from "../internals/Player";
import { client } from "../main";


export default class extends Command {
  name = "test";
  aliases = ["t"]

  async exec(msg: Message, args: string[]) {

    const [arg1, arg2] = args;

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

    if (arg1 === "xp") {
      addXP(player.id, parseInt(arg2));
      msg.channel.send(`Added ${arg2} xp`)

    } else if (arg1 === "gem") {

      const size = parseInt(args[1]) || 1000;
      const stones = new List<Stone>();

      for (let i = 0; i < size; i++) {
        stones.push(Stone.random());
      }

      stones.sort((a, b) => b.rarity - a.rarity);

      const aggregate = stones.aggregateBy(x => x.rarity.toString())
        .map(x => {
          const stone = x.value instanceof Gem ? x.value.quality : x.value.name;
          const countPercent = (x.count / stones.length) * 100;
          
          return `${stone} x${x.count} \`${countPercent.toFixed(2)}%\``;
        })
        .join("\n");

      msg.channel.send(aggregate);
      msg.channel.send(`Sample size: ${size}`)

    } else if (arg1 === "gemall") {

      const stones = new List<Stone>();

      for (const stone of Stone.all) {
        const count = stone.rarity * 1000;
        for (let i = 0; i < count; i++) {
          stones.push(stone);
        }
      }

      const aggregate = stones.aggregateBy(x => x.rarity.toString())
        .map(x => {
          const stone = x.value instanceof Gem ? x.value.quality : x.value.name;
          const countPercent = (x.count / stones.length) * 100;
          
          return `${stone} x${x.count} \`${countPercent.toFixed(2)}%\``;
        })
        .join("\n");

      msg.channel.send(aggregate);
    }


  }
}
