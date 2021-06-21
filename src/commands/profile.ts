import { GuildMember, Message } from "discord.js";
import createProfile from "./createProfile";
import hasUser from "../db/hasUser";
import { getUsers } from "../db/getUsers";
import { getTotalPoints, getTotalXp } from "../db/getTotalPoints";
import { backgrounds } from "./rank";

export async function profile(msg: Message, args: string[]) {

  await msg.guild?.members.fetch();

  const userId = args[0] || msg.author.id;
  const member = msg.guild?.members.cache.get(userId);
  const guild = msg.guild;

  if (!member)
    return msg.channel.send("Member does not exist");
  else if (!guild)
    return;

  const user = await hasUser(member.user.id);

  if (!user)
    return msg.channel.send("User has not registered to any challenge");

  const users = await getUsers();
  const cards: { 
    member: GuildMember, 
    point: number,
    xp: number,
  }[] = [];

  await guild.members.fetch();

  for (const user of users) {

    let member = guild.members.cache.get(user.DiscordID);
    if (!member) {
        continue;
    }

    const xp = await getTotalXp(user.DiscordID);
    const point = await getTotalPoints(user.DiscordID);
    cards.push({ member, xp, point });
  }

  cards.sort((a, b) => b.xp - a.xp);

  const rank = cards.findIndex(x => x.member.user.id === userId)!;
  const {xp, point} = cards.find(x => x.member.user.id === userId)!;

  const card = await createProfile(member, { 
    rank: rank + 1,
    image: backgrounds[rank],
  });
  await msg.channel.send(card);
  await msg.channel.send(`Total Points: **${point}** Total xp: **${xp}**`);
}

