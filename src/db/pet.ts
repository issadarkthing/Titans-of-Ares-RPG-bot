import { PetID } from "../internals/Pet";
import { dbAll, dbGet, dbRun } from "./promiseWrapper"

export interface Pet {
  ID: number;
  OwnerID: string;
  Created: string;
  PetID: PetID;
  Star: number;
  Active: number;
}

export async function getPet($ownerID: string, $petID: string) {

  const sql = `
  SELECT *
  FROM Pet
  WHERE OwnerID = $ownerID AND PetID = $petID
  `

  return dbGet<Pet>(sql, { $ownerID, $petID });
}

export async function getAllPets($ownerID: string) {
  
  const sql = `
  SELECT *
  FROM PET
  WHERE OwnerID = $ownerID
  `

  return dbAll<Pet>(sql, { $ownerID });
}

export function addPet($ownerID: string, $petID: string) {

  const sql = `
  INSERT INTO Pet (OwnerID, PetID)
  VALUES ($ownerID, $petID)
  `

  return dbRun(sql, { $ownerID, $petID });
}

export function upgradePet($ownerID: string, $petID: string, $star = 1) {
  
  const sql = `
  UPDATE Pet
  SET Star = Star + $star
  WHERE OwnerID = $ownerID AND PetID = $petID
  `

  return dbRun(sql, { $ownerID, $petID, $star });
}
