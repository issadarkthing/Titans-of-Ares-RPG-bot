import { getXp } from "../internals/utils";
import { getActivity } from "./getActivity";
import { getConvertTable } from "./getConversions";
import { dbGet } from "./promiseWrapper";


export async function getTotalPoints(userId: string) {

  const activities = await getActivity(userId);
  const convertTable = await getConvertTable();

  let totalPoints = 0;

  activities.forEach(activity => {
    const tag = `${activity.ValueType}-${activity.ChallengeID}`;
    const multiplier = convertTable.get(tag);
    if (multiplier) {
      totalPoints += multiplier * activity.Value;
    }
  })

  return Math.round(totalPoints);
}

export const makeXPTable = `
    CREATE TABLE IF NOT EXISTS Player (
      DiscordID	TEXT NOT NULL UNIQUE,
      XP        DEFAULT 0,
      Coin      DEFAULT 0,
      PRIMARY KEY("DiscordID")
    )
`;

export async function getXpFromTable($userId: string): Promise<number> {

  const sql = `
    SELECT XP
    FROM Player
    WHERE DiscordID = $userId
  `;

  return dbGet<{ XP: number }>(sql, { $userId })
    .then(row => row?.XP || 0);
}

export async function getTotalXp(userId: string) {
  const xp = await getXpFromTable(userId);
  return getTotalPoints(userId)
    .then(points => getXp(points) + xp);
}
