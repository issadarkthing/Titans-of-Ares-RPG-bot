import { db } from "..";
import { getXp } from "../commands/utils";
import { getActivity } from "./getActivity";
import { getConvertTable } from "./getConversions";


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

export async function getXpFromTable(userId: string): Promise<number> {

  const makeTable = `
    CREATE TABLE IF NOT EXISTS "XP" (
      "ID"	      INTEGER NOT NULL UNIQUE,
      "DiscordID"	TEXT NOT NULL,
      "XP"        INTEGER NOT NULL,
      PRIMARY KEY("ID" AUTOINCREMENT)
    )
  `;

  return new Promise((resolve, reject) => {

    db.run(makeTable, (err) => {

      if (err) {
        return reject(err);
      }

      const sql = `
      SELECT XP
      FROM XP
      WHERE DiscordID = "${userId}"
    `;

      db.get(sql, (err, row) => {
        if (err) {
          return reject(err);
        }

        resolve(row?.XP || 0);
      })

    })
  })
}

export async function getTotalXp(userId: string) {
  const xp = await getXpFromTable(userId);
  return getTotalPoints(userId)
    .then(points => getXp(points) + xp);
}
