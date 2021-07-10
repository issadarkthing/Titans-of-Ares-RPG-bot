import { stripIndents } from "common-tags";
import { Message } from "discord.js";


export default function(msg: Message, args: string[]) {

  const message = stripIndents`
  **$profile**
  This will show your profile with all your ranking, level, stats, buffs and
  energy. This is your main overview of your character.

  **$battle**
  This will allow you to battle Ares Challengers from level 1 to level 50. You
  can only challenge 1 level higher than your maximum defeated level. Winning
  against challengers award coins. You can only battle if you have energy, it
  replenishes automatically every 8 hours to a max of 5. Check your current
  energy with $profile!
  `


  msg.channel.send(message);
}
