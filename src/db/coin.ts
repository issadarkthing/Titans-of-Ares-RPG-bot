import { dbGet, dbRun } from "./promiseWrapper";

export async function getCoin($userId: string) {
  const sql = `
    SELECT Coin
    FROM Player
    WHERE DiscordID = $userId
  `;

  return dbGet<{ Coin?: number }>(sql, { $userId })
    .then(x => x?.Coin || 0);
}

export async function setCoin($userId: string, $amount: number) {
  const sql = `
    INSERT INTO Player(DiscordID, Coin)
    VALUES ( $userId, $amount )
    ON CONFLICT(DiscordID)
    DO UPDATE SET Coin = $amount
  `; 
  return dbRun(sql, { $userId, $amount });
}
