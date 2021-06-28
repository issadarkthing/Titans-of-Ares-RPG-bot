import { Message } from "discord.js";
import { Player } from "../internals/player";
import { showTimeLeft } from "../internals/timers";

export async function energy(msg: Message, args: string[]) {

  const member = msg.member;

  if (!member) return;

  const timeLeft = await showTimeLeft(member.id);
  const player = await Player.getPlayer(member);

  msg.channel.send(`Energy: ${player.energy}/3 ${timeLeft}`);
}

