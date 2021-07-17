// this table records timer for user energy charger
export const makeTimerTable = `
  CREATE TABLE IF NOT EXISTS Timer (
    ID        INTEGER NOT NULL UNIQUE,
    DiscordID TEXT NOT NULL,
    Name      TEXT NOT NULL,
    Created   DEFAULT CURRENT_TIMESTAMP,
    Expires   TEXT NOT NULL,
    PRIMARY KEY(ID AUTOINCREMENT)
  )
`;

export const makePlayerTable = `
    CREATE TABLE IF NOT EXISTS Player (
      DiscordID	         TEXT NOT NULL UNIQUE,
      XP                 DEFAULT 0,
      Coin               DEFAULT 0,
      Energy             DEFAULT 5,
      ChallengerMaxLevel DEFAULT 0,
      GoldMedal          DEFAULT 0,
      SilveMedal         DEFAULT 0,
      BronzeMedal        DEFAULT 0,
      Buff               TEXT,
      FragmentReward     DEFAULT 500,
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

export const makeXPEntryTable = `
  CREATE TABLE IF NOT EXISTS XPEntry (
    ID          INTEGER PRIMARY KEY,
    ChallengeID INTEGER,
    Day         INTEGER,
    XP          INTEGER,
    DiscordID   TEXT
  )
`;

export const makeProfileTable = `
  CREATE TABLE IF NOT EXISTS Profile (
    DiscordID   TEXT PRIMARY KEY,
    Checksum    TEXT NOT NULL,
    Data        BLOB NOT NULL
  )
`

export const makeInventoryTable = `
  CREATE TABLE IF NOT EXISTS Inventory (
    ID      INTEGER PRIMARY KEY,
    OwnerID TEXT NOT NULL,
    Created DEFAULT CURRENT_TIMESTAMP,
    ItemID  TEXT NOT NULL
  )
`

export const makePetTable = `
  CREATE TABLE IF NOT EXISTS Pet (
    ID      INTEGER PRIMARY KEY,
    OwnerID TEXT NOT NULL,
    Created DEFAULT CURRENT_TIMESTAMP,
    PetID   TEXT NOT NULL,
    Star    DEFAULT 0,
    Active  DEFAULT FALSE
  )
`
