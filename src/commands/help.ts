import { Message } from "discord.js";


export default function(msg: Message, args: string[]) {

  const message = `
  \`\`\`yaml
  Command Manual

  [] - optional
  <> - required

  $rank [count]
  Reset rank leaderboard. Count is the number of users to be shown on the rank
  board. Leaving it out causes the board to show all players.

  $profile [userId]
  Show user profile. User id can be given to show other user profile.\`\`\``


  msg.channel.send(message);
}
