// this table records timer for user energy charger
export let schema = `
  CREATE TABLE IF NOT EXISTS Timer (
    ID        INTEGER NOT NULL UNIQUE,
    DiscordID TEXT NOT NULL,
    Name      TEXT NOT NULL,
    Created   DEFAULT CURRENT_TIMESTAMP,
    Expires   TEXT NOT NULL,
    PRIMARY KEY(ID AUTOINCREMENT)
  );
`;

schema += `
    CREATE TABLE IF NOT EXISTS Player (
      DiscordID	         TEXT NOT NULL UNIQUE,
      XP                 DEFAULT 0,
      Coin               DEFAULT 0,
      ArenaCoin          DEFAULT 0,
      Energy             DEFAULT 5,
      ChallengerMaxLevel DEFAULT 0,
      GoldMedal          DEFAULT 0,
      SilveMedal         DEFAULT 0,
      BronzeMedal        DEFAULT 0,
      Buff               TEXT,
      FragmentReward     DEFAULT 500,
      MiningPickReward   DEFAULT 10,
      PRIMARY KEY("DiscordID")
    );
`;

schema += `
  CREATE TABLE IF NOT EXISTS Challenger (
    ID         INTEGER PRIMARY KEY,
    Name       TEXT,
    Loot       INT,
    HP         INT,
    Strength   INT,
    Speed      INT,
    Armor      INT,
    CritChance REAL
  );
`;

schema += `
  CREATE TABLE IF NOT EXISTS XPEntry (
    ID          INTEGER PRIMARY KEY,
    ChallengeID INTEGER,
    Day         INTEGER,
    XP          INTEGER,
    DiscordID   TEXT
  );
`;

schema += `
  CREATE TABLE IF NOT EXISTS Profile (
    DiscordID   TEXT PRIMARY KEY,
    Checksum    TEXT NOT NULL,
    Data        BLOB NOT NULL
  );
`

schema += `
  CREATE TABLE IF NOT EXISTS Inventory (
    ID      INTEGER PRIMARY KEY,
    OwnerID TEXT NOT NULL,
    Created DEFAULT CURRENT_TIMESTAMP,
    ItemID  TEXT NOT NULL
  );
`

schema += `
  CREATE TABLE IF NOT EXISTS Pet (
    ID      INTEGER PRIMARY KEY,
    OwnerID TEXT NOT NULL,
    Created DEFAULT CURRENT_TIMESTAMP,
    PetID   TEXT NOT NULL,
    Star    DEFAULT 0,
    Active  DEFAULT FALSE
  );
`

schema += `
  CREATE TABLE IF NOT EXISTS Gear (
    ID          INTEGER PRIMARY KEY,
    InventoryID INTEGER UNIQUE NOT NULL,
    Equipped    DEFAULT FALSE,
    Level       DEFAULT 0
  );
`

schema += `
  CREATE TABLE IF NOT EXISTS TeamArena (
    ID        INTEGER PRIMARY KEY,
    Created   TEXT NOT NULL,
    Phase     DEFAULT "signup_1",
    MessageID TEXT
  );
`

schema += `
  CREATE TABLE IF NOT EXISTS TeamArenaMember (
    ID          INTEGER PRIMARY KEY,
    Created     TEXT NOT NULL,
    TeamArenaID INT NOT NULL,
    DiscordID   TEXT NOT NULL,
    Charge      DEFAULT 10,
    Team        TEXT,
    Score       DEFAULT 0
  );
`

schema += `
  CREATE TABLE IF NOT EXISTS Gem (
    ID          INTEGER PRIMARY KEY,
    Created     TEXT NOT NULL,
    InventoryID INTEGER NOT NULL,
    GearID      INTEGER
  );
`

schema += `
  CREATE TABLE IF NOT EXISTS Book (
    ID          INTEGER PRIMARY KEY,
    DiscordID   TEXT NOT NULL,
    ChallengeID INTEGER NOT NULL,
    Day         INTEGER NOT NULL,
    Name        TEXT NOT NULL,
    Lesson      TEXT NOT NULL,
    Evaluation  TEXT,
    Finished    DEFAULT 0
  );
`
