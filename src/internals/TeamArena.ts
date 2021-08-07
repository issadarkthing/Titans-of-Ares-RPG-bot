import { DateTime } from "luxon";

enum Days {
  MONDAY = 1, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY
}

enum Phase {
  SIGNUP_1 = "signup_1",
  SIGNUP_2 = "signup_2",
  SIGNUP_3 = "signup_3",
  PREPARING = "preparing",
  BATTLE_1 = "battle_1",
  BATTLE_2 = "battle_2",
  BATTLE_3 = "battle_3",
  REWARD = "reward",
}

export class TeamArena {

  isSignUpPhase1(time: DateTime) {
    return time.weekday >= Days.MONDAY && time.hour >= 7;
  }

  isSignUpPhase2(time: DateTime) {
    return time.weekday >= Days.TUESDAY && time.hour >= 7;
  }

  isSignUpPhase3(time: DateTime) {
    return time.weekday >= Days.TUESDAY && time.hour >= 19;
  }

  isPreparingPhase(time: DateTime) {
    return time.weekday >= Days.WEDNESDAY && time.hour >= 7;
  }

  isBattlePhase1(time: DateTime) {
    return time.weekday >= Days.THURSDAY && time.hour >= 7;
  }

  isBattlePhase2(time: DateTime) {
    return time.weekday >= Days.FRIDAY && time.hour >= 7;
  }

  isBattlePhase3(time: DateTime) {
    return time.weekday >= Days.FRIDAY && time.hour >= 19;
  }

  isRewardPhase(time: DateTime) {
    return time.weekday >= Days.SATURDAY && time.hour >= 7;
  }

  getPhase(now: DateTime) {
    switch (true) {
      case this.isRewardPhase(now): return Phase.REWARD;
      case this.isBattlePhase3(now): return Phase.BATTLE_3;
      case this.isBattlePhase2(now): return Phase.BATTLE_2;
      case this.isBattlePhase1(now): return Phase.BATTLE_1;
      case this.isPreparingPhase(now): return Phase.PREPARING;
      case this.isSignUpPhase3(now): return Phase.SIGNUP_3;
      case this.isSignUpPhase2(now): return Phase.SIGNUP_2;
      case this.isSignUpPhase1(now): return Phase.SIGNUP_1;
    }
  }

  currentPhase() {
    return this.getPhase(DateTime.now());
  }
}
