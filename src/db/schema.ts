// this table records timer for user energy charger
export const makeTimerTable = `
  CREATE TABLE IF NOT EXISTS Timer (
    DiscordID TEXT NOT NULL UNIQUE,
    Name      TEXT NOT NULL,
    Created   DEFAULT CURRENT_TIMESTAMP,
    Expires   TEXT NOT NULL,
    PRIMARY KEY(DiscordID)
  )
`;

export const makePlayerTable = `
    CREATE TABLE IF NOT EXISTS Player (
      DiscordID	         TEXT NOT NULL UNIQUE,
      XP                 DEFAULT 0,
      Coin               DEFAULT 0,
      Energy             DEFAULT 5,
      ChallengerMaxLevel DEFAULT 0,
      PRIMARY KEY("DiscordID")
    )
`;

export const makeChallengerTable = `
  CREATE TABLE IF NOT EXISTS Challenger (
    ID         INTEGER PRIMARY KEY,
    Name       TEXT,
    Loot       INT,
    HP         INT,
    Strength   INT,
    Speed      INT,
    Armor      INT,
    CritChance REAL
  )
`;
