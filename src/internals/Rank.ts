import { GuildMember } from "discord.js";
import { client } from "../main";

type RankName =
  "Apprentice"
| "Private"
| "Corporal"
| "Sergeant"
| "Lieutenant"
| "Captain"
| "Major"
| "Colonel"
| "General";

type Ranks = `Titan ${RankName}`;

export class Rank {

  rankNames: Ranks[] = [
    "Titan Apprentice",
    "Titan Private",
    "Titan Corporal",
    "Titan Sergeant",
    "Titan Lieutenant",
    "Titan Captain",
    "Titan Major",
    "Titan Colonel",
  ];

  getRankRole(level: number) {

    let rankName = "";
    switch (true) {
      case level <= 50: rankName = "Titan Apprentice"; break;
      case level <= 100: rankName = "Titan Private"; break;
      case level <= 150: rankName = "Titan Corporal"; break;
      case level <= 200: rankName = "Titan Sergeant"; break;
      case level <= 250: rankName = "Titan Lieutenant"; break;
      case level <= 300: rankName = "Titan Captain"; break;
      case level <= 350: rankName = "Titan Major"; break;
      case level <= 450: rankName = "Titan Colonel"; break;
      default: rankName = "Titan General"; break;
    }

    return client.mainGuild.roles.cache.find(x => x.name === rankName)!;
  }

  getCurrentRole(member: GuildMember) {
    return member.roles.cache
      .find(x => this.rankNames.includes(x.name as Ranks));
  }

  createRoles() {

    const roles = client.mainGuild.roles.cache;

    for (const rankName of this.rankNames) {
      
      if (!roles.find(role => role.name === rankName)) {
        client.mainGuild.roles.create({ data: { name: rankName } });
      }
    }
  }
}
