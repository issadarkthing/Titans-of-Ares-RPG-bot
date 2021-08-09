import { Message } from "discord.js";
import { getCurrentArena, joinArena } from "../db/teamArena";
import Command from "../internals/Command";
import { Player } from "../internals/Player";
import { Phase } from "../internals/TeamArena";


export default class extends Command {
  name = "teamArena";

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async exec(msg: Message, _args: string[]) {

    const player = await Player.getPlayer(msg.member!);
    const arena = await getCurrentArena();
    const phase = arena.Phase;

    if (
      phase === Phase.SIGNUP_1 ||
      phase === Phase.SIGNUP_2 ||
      phase === Phase.SIGNUP_3
    ) {

      await joinArena(arena.ID, player.id);
    }
  }
}
