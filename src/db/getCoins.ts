import { dbGet } from "./promiseWrapper";



export async function getCoin($userId: string) {
  const sql = `
    SELECT Coin
    FROM Player
    WHERE DiscordID = $userId
  `;

  return dbGet<{ Coin?: number }>(sql, { $userId })
    .then(x => x?.Coin || 0);
}
