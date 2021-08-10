import { setFragmentReward, XP_REWARD } from "../db/fragmentReward";
import { addInventory } from "../db/inventory";
import { Pet } from "./Pet";
import { Player } from "./Player";
import { random, totalLevelPassed, upperLimit } from "../internals/utils";
import { getUsers } from "../db/player";
import { client } from "../main";


export class FragmentReward {

  static upperLimit(xp: number) {
    return upperLimit(xp, XP_REWARD);
  }

  static totalLevelPassed(xp: number) {
    return totalLevelPassed(xp, XP_REWARD);
  }

  static async reward(player: Player) {
    const fragment = Pet.random().fragment;
    await addInventory(player.id, fragment.id);
    return fragment;
  }

  /** sets new upper limit based of player's xp */
  static setUpperLimit(player: Player) {
    return setFragmentReward(player.id, FragmentReward.upperLimit(player.xp));
  }

  /** 20% chance to earn fragment reward */
  static random() {
    return random().bool(0.2);
  }
}

export async function rewardAll() {

  const users = await getUsers();
  const guild = await client.bot.guilds.fetch(client.serverID);
  const members = await guild.members.fetch();
  let rewardedUser = 0;

  client.db.exec("BEGIN TRANSACTION");
  for (const user of users) {
    const member = members.get(user.DiscordID);
    if (!member) {
      console.log(`Skipping ${user.DiscordID}, member no longer in the server`);
      continue;
    }

    const player = await Player.getPlayer(member);
    const rewards = FragmentReward.totalLevelPassed(player.xp);
    for (let i = 0; i < rewards; i++) {
      const getsReward = FragmentReward.random();
      if (getsReward) {
        const fragment = await FragmentReward.reward(player);
        console.log(`${player.name} received ${fragment.name}`);

      } else {
        console.log(`${player.name} missed the fragment reward`)

      }
    }

    await FragmentReward.setUpperLimit(player);
    await player.sync();

    console.log(`${player.name} xp: ${player.xp} fragmentReward: ${player.fragmentReward}`);
    rewardedUser++;
  }
    
  client.db.exec("COMMIT");

  console.log(`Total ${rewardedUser} players have been rewarded`);
}
