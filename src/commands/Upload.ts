import Command from "../internals/Command";
import { Message } from "discord.js";
import { CancelledInputError, Prompt } from "../internals/Prompt";
import {
  BLUE_BUTTON,
  bold,
  getXp,
  RED_BUTTON,
  split,
  NUMBER_BUTTONS as NB,
  inlineCode,
} from "../internals/utils";
import { ButtonHandler } from "../internals/ButtonHandler";
import { oneLine } from "common-tags";
import { client } from "../main";
import {
  registerDayEntry,
  ChallengeName,
  getChallengeByChannelID,
  getConvertTable,
  replaceDayEntry,
  addDayEntry,
  Challenge,
  OverlapError,
  getDayEntries,
} from "../db/monthlyChallenge";
import { DateTime } from "luxon";

type RegisterOptions = {
  value: number;
  challengeName: ChallengeName;
  activityName: string;
  day: number;
  replaceOnly?: boolean;
};

export default class Upload extends Command {
  name = "upload";
  aliases = ["up"];
  msg!: Message;
  convertTable!: Map<string, number>;
  challenge!: Challenge;
  date!: DateTime;
  maxDay!: number;
  month!: string;
  prompt!: Prompt;

  async exec(msg: Message, args: string[]) {

    const channelID = client.isDev ? "859483633534238762" : msg.channel.id;
    this.msg = msg;
    this.challenge = await getChallengeByChannelID(channelID);
    this.prompt = new Prompt(this.msg, { cancelKeyword: ["cancel"] });
    this.convertTable = await getConvertTable();

    if (!this.challenge) {
      return msg.channel.send("wrong channel");
    }

    this.date = DateTime.local(this.challenge.Year, this.challenge.Month - 1);
    this.maxDay = this.date.daysInMonth;
    this.month = this.date.monthLong;

    const categoryHandler = new Map<string, () => Promise<void>>();
    categoryHandler.set("steps", () => this.handleSteps());
    categoryHandler.set("cycling", () => this.handleCycling());
    categoryHandler.set("strength", () => this.handleStrength());
    categoryHandler.set("yoga", () => this.handleYogaAndMeditation("yoga"));
    categoryHandler.set("meditation", () => this.handleYogaAndMeditation("meditation"));
    categoryHandler.set("rowing", () => this.handleRowing());
    categoryHandler.set("othercardio", () => this.handleOtherCardio());
    categoryHandler.set("bonus challenges", () => this.handleBonusChallenges());

    let handler: undefined | (() => Promise<void>);

    if (args[0]) {

      let category = args[0];
      
      if (category === "bonus") {
        category = "bonus challenges";
      }

      const cb = categoryHandler.get(category);

      if (!cb) {
        const categories = [...categoryHandler.keys()]
          .map(x => inlineCode(x === "bonus challenges" ? "bonus" : x))
          .join(", ");

        return msg.channel.send(
          oneLine`Invalid category. Valid categories are ${categories}.`
        );
      }

      handler = cb;
    }

    const question = "Please select a category to upload for points";
    const menu = new ButtonHandler(msg, question);

    let i = 1;
    for (const [category, handler] of categoryHandler) {
      menu.addButton(NB[i], category, handler);
      i++;
    }

    menu.addCloseButton();

    try {

      handler ? await handler() : await menu.run();

      msg.channel.send(
        oneLine`For a total overview of your uploads this month, use
        \`${client.prefix}progress\``
      );

    } catch (err) {
      msg.channel.send(err.message);
      msg.channel.send(
        `Upload process failed. Please rerun \`${client.prefix}${this.name}\``
      );
    }
  }

  private getConversionRate(challengeName: ChallengeName) {
    const lookupID = `${challengeName}-${this.challenge.ID}`;
    const conversionRate = this.convertTable.get(lookupID);

    if (!conversionRate)
      throw new Error(`conversion rate does not exists for "${lookupID}"`);

    return conversionRate;
  }

  private validateDays(days: number[]) {
    for (const day of days) {
      this.validateDay(day);
    }
  }

  private validateNumber(num: number) {
    if (Number.isNaN(num)) {
      throw new Error(`${inlineCode(num)} is not valid number type`);
    }
  }

  private showSuccessMessage(data: RegisterOptions) {

    const conversionRate = this.getConversionRate(data.challengeName);
    const points = Math.round(conversionRate * data.value);
    const xp = getXp(points);
    const amount = data.value === 1 ? "a" : bold(data.value);

    const text =
      oneLine`You have registered ${amount} ${data.activityName} on
      ${bold(this.month)} ${bold(data.day)} and earned ${bold(points)} monthly
      points + ${bold(xp)} permanent XP!`;

    this.msg.channel.send(text);
  }

  private showAddMessage(data: RegisterOptions) {

    const conversionRate = this.getConversionRate(data.challengeName);
    const points = Math.round(conversionRate * data.value);
    const xp = getXp(points);
    const amount = data.value === 1 ? "a" : bold(data.value);

    const text =
      oneLine`You have registered ${amount} additional
      ${data.activityName} on ${bold(this.month)} ${bold(data.day)} and earned
      ${bold(points)} monthly points + ${bold(xp)} permanent XP!`;

    this.msg.channel.send(text);
  }


  private showReplaceMessage(data: RegisterOptions) {

    const conversionRate = this.getConversionRate(data.challengeName);
    const points = Math.round(conversionRate * data.value);
    const xp = getXp(points);
    const amount = data.value === 1 ? "a" : bold(data.value);

    const text =
      oneLine`You have registered ${amount} ${data.activityName} on
      ${bold(this.month)} ${bold(data.day)} and earned ${bold(points)} monthly
      points + ${bold(xp)} permanent XP! Your previous gained points for this
      day have been removed.`;

    this.msg.channel.send(text);
  }

  private validateDay(day: number) {
      if (Number.isNaN(day) || day > this.maxDay || day <= 0) {
        throw new Error(
          oneLine`Please only write the day of the the month (Example: use "5"
          for the 5th day in the month).`
        );
      }
  }

  private async getProof(
    value: number,
    activityName: string,
    day: number,
    question?: string,
  ) {

    try {

      const collected = await this.prompt.collect(
        question ||
        oneLine`Please upload a single screenshot of your wearable showing
        ${bold(value)} ${activityName} on ${bold(this.month)} ${bold(day)}.`,
        { max: 1 },
      );

      if (collected.attachments.size <= 0) {
        throw new Error("At least one screenshot is needed");
      }

    } catch (e: unknown) {
      const err = e as CancelledInputError;

      if (err.keyword === "cancel") {
        throw new Error("Cancelled");
      } else {
        throw err;
      }
    }
  }

  private async getMultiProof(activity: string) {

    try {

      const collected = await this.prompt.collect(
        oneLine`Please upload one or more screenshots proving your ${activity}
        for these days of the month. When done, please write 'done' in the
        channel.`,
        { max: Number.MAX_SAFE_INTEGER, cancelKeyword: ["done", "cancel"] },
      );

      if (collected.attachments.size <= 0) {
        throw new Error("At least one screenshot is needed");
      }

    } catch (e: unknown) {
      const err = e as CancelledInputError;

      if (err.keyword !== "done") {
        throw err;
      }
    }
  }

  private async registerDay(options: RegisterOptions) {

    try {

      await registerDayEntry(
        this.msg.author.id,
        options.day,
        this.challenge.ID,
        options.challengeName,
        options.value,
      );

      this.showSuccessMessage(options);

    } catch (e: unknown) {

      const { day, activityName, value } = options;
      const err = e as OverlapError;
      const amount = value === 1 ? "a" : bold(err.dayEntry.Value);
      const question =
        oneLine`You already registered ${amount} ${activityName} on
        ${bold(this.month)} ${bold(day)}. Do you want to
        replace ${options?.replaceOnly ? "" : "or add"}
        points on this day?`;

      const menu = new ButtonHandler(this.msg, question);

      menu.addButton(BLUE_BUTTON, "replace", () => {
        replaceDayEntry(
          this.msg.author.id,
          options.day,
          this.challenge.ID,
          options.challengeName,
          options.value,
        );

        this.msg.channel.send(`Successfully replaced`);
        this.showReplaceMessage(options);
      });

      if (!options?.replaceOnly) {

        menu.addButton(RED_BUTTON, "add points", () => {
          addDayEntry(
            this.msg.author.id,
            options.day,
            this.challenge.ID,
            options.challengeName,
            options.value,
          );

          this.msg.channel.send(`Successfully added`);
          this.showAddMessage(options);
        });
      }

      menu.addCloseButton();
      await menu.run();
    }
  }

  private async registerDays(
    days: number[],
    values: number[],
    messageOptions: Omit<RegisterOptions, "value" | "day">,
  ) {

      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        const value = values[i];
        const successOptions: RegisterOptions = {
          ...messageOptions,
          day,
          value,
        }

        await this.registerDay(successOptions);
      }
  }

  private validateMultiRegister<T>(
    days: number[],
    values: T[],
    activityName: string,
  ) {
    if (days.length !== values.length) {
      throw new Error(
        oneLine`You are uploading for ${days.length} days but only
        ${values.length} ${activityName} are given.`
      );
    }
  }

  private async handleBonusChallenges() {

    const menu = new ButtonHandler(this.msg, 
      oneLine`There are multiple bonus challenges every month. Click on one to
      get more details or if you want to upload a bonus challenge.`
    );

    menu.addButton(NB[1], "Get a 5 point weekstreak", () => {

      this.msg.channel.send(
        oneLine`You can obtain 10 additional monthly points (and 20 permanent
        XP) every week by earning 5 points daily Monday to Sunday. The bot will
        let you know when you have earned this bonus and will add the points
        automatically!`
      );
    });

    menu.addCloseButton();
    await menu.run();
  }

  private async handleOtherCardio() {

    const challengeName = "othercardio";
    const question = oneLine`You can earn 0,2 points for every minute of other
    cardio. Only cardio with average heartrate of 125+ can be uploaded. The
    cardio should not fit other categories or already award steps in a
    reasonable way (running is already awarded by steps).`;

    const activityName = " minutes other cardio session";

    const menu = new ButtonHandler(this.msg, question);

    menu.addButton(BLUE_BUTTON, "single", async () => {

      const answer = await this.prompt.ask(
        oneLine`Please write the day of the month you want to upload other
        cardio for.`
      );

      const month = this.month;
      const day = parseInt(answer);

      this.validateDay(day);

      const minutes = parseInt(await this.prompt.ask(
        oneLine`Please write how many full minutes of other cardio (no decimals)
        you want to upload for ${month} ${day}.`
      ));

      this.validateNumber(minutes);

      await this.getProof(
        minutes,
        activityName,
        day,
        oneLine`Please upload a single screenshot of your wearable showing
        ${bold(minutes)} minutes of other cardio with average heartrate above 125+ on
        ${bold(month)} ${bold(day)}.`,
      );

      await this.registerDay({
        value: minutes,
        activityName,
        challengeName: challengeName,
        day,
      })

    });

    menu.addButton(RED_BUTTON, "multiple", async () => {

      const answer = await this.prompt.ask(
        oneLine`Please write the days of the month you want to upload other
        cardio for and seperate them with a space (example: 1 2 3 4 ….)`
      );

      const days = split(answer).map(x => parseInt(x));

      this.validateDays(days);

      const minutesAnswer = await this.prompt.ask(
        oneLine`Please write how many full minutes of other cardio (no decimals)
        you want to upload for days ${bold(days.join(", "))} in the right order,
        please seperate them with a space \`(example: 60 90 42 30 …)\``
      );

      const sessions = split(minutesAnswer).map(x => parseInt(x));

      this.validateMultiRegister(days, sessions, activityName);

      await this.getMultiProof(activityName);

      await this.registerDays(days, sessions, {
        challengeName: "othercardio",
        activityName,
      });
    })

    menu.addCloseButton();
    await menu.run();
  }

  private async handleRowing() {

    const question = oneLine`You can earn 1 point for every 1km or 0,62mi rowed.
      Do you want to upload a single day or multiple days?`;

    const menu = new ButtonHandler(this.msg, question);
    let unit: "km" | "mi" = "km";
    let challengeName: ChallengeName = "rowingkm";
    const activityName = "rowed";

    menu.addButton(BLUE_BUTTON, "single", async () => {

      const question = "Do you want to upload rowing distance in km or mi?";
      const menu = new ButtonHandler(this.msg, question);

      menu.addButton(BLUE_BUTTON, "km", () => {
        challengeName = "rowingkm";
        unit = "km";
      });

      menu.addButton(RED_BUTTON, "mi", () => {
        challengeName = "rowingmi";
        unit = "mi";
      });

      menu.addCloseButton();
      await menu.run();

      const day = parseInt(await this.prompt.ask(
        oneLine`Please write the day of the month you want to upload cycling
        (${unit}) for.`
      ));

      const month = this.month;

      this.validateDay(day);

      const distance = parseFloat(await this.prompt.ask(
        oneLine`Please write the distance (${unit}) you have cycled on
        ${bold(day)} ${bold(month)}`
      ));

      if (Number.isNaN(distance) || distance <= 0) {
        throw new Error("invalid distance")
      }

      await this.getProof(distance, activityName, day);

      await this.registerDay({
        value: distance,
        challengeName: challengeName,
        activityName: activityName,
        day,
      })

    })

    menu.addButton(RED_BUTTON, "multiple", async () => {

      const question = "Do you want to upload rowing distance in km or mi?";
      const menu = new ButtonHandler(this.msg, question);

      menu.addButton(BLUE_BUTTON, "km", () => {
        challengeName = "rowingkm";
        unit = "km";
      });

      menu.addButton(RED_BUTTON, "mi", () => {
        challengeName = "rowingmi";
        unit = "mi";
      });

      menu.addCloseButton();
      await menu.run();


      const answer = await this.prompt.ask(
        oneLine`Please write the days of the month you want to rowing ${unit}
        steps for and seperate them with a space \`(example: 1 2 3 4 ….)\``
      );

      const days = split(answer).map(x => parseFloat(x));

      this.validateDays(days);

      const rowsRespond = await this.prompt.ask(
        oneLine`Please write how many rowing ${unit} you want to upload for days
        ${days.join(" ")} in the right order, please seperate them with a space
        \`(example: 5,27 20,54 7,25 8,55 …)\``
      );

      const rows = split(rowsRespond).map(x => parseFloat(x));

      this.validateMultiRegister(days, rows, `${unit} rowed`);

      for (const row of rows) {
        if (Number.isNaN(row)) {
          throw new Error(`invalid format "${row}"`);
        }
      }

      await this.getMultiProof(`${unit} rowed`);

      await this.registerDays(days, rows, {
        challengeName: challengeName,
        activityName: `${unit} rowed`,
      });

    })

    menu.addCloseButton();
    await menu.run();
  }

  private async handleYogaAndMeditation(activity: "yoga" | "meditation") {

    const id = this.challenge.ID;
    const yoga10points = this.convertTable.get(`yoga10-${id}`);
    const yoga30points = this.convertTable.get(`yoga30-${id}`);
    const meditation10points = this.convertTable.get(`meditation10-${id}`);
    const meditation30points = this.convertTable.get(`meditation30-${id}`);

    const [session10points, session30points] = activity === "yoga" ?
      [yoga10points, yoga30points] :
      [meditation10points, meditation30points];

    const question = oneLine`You can earn ${session10points} points for
    ${activity} over 10 minutes. You can earn ${session30points} points for
    ${activity} over 30 minutes. Do you want to upload a single day or multiple
    days?`;

    const menu = new ButtonHandler(this.msg, question);

    menu.addButton(BLUE_BUTTON, "single", async () => {

      const answer = await this.prompt.ask(
        oneLine`Please write the day of the month you want to upload a
        ${activity} session for.`
      );

      const month = this.month;
      const day = parseInt(answer);
      let session: 10 | 30 = 10;

      this.validateDay(day);

      const sessionQuestion = "Was your session over 10 minutes or 30 minutes?";
      const menu = new ButtonHandler(this.msg, sessionQuestion);

      menu.addButton(BLUE_BUTTON, "10 minutes", () => { session = 10; });
      menu.addButton(RED_BUTTON, "30 minutes", () => { session = 30; });

      const challengeName: ChallengeName = `${activity}${session}`;

      menu.addCloseButton();
      await menu.run();

      await this.getProof(
        1,
        `${activity} session`,
        day,
        oneLine`Please upload a single screenshot of your wearable showing the
        date, duration of workout and heartrate. Alternatively, a photo of the
        ${activity} spot with mentioned elapsed time and/or additional
        information can be accepted.`,
      );

      const options: RegisterOptions = {
        value: 1,
        challengeName: challengeName,
        activityName: `${session} minutes ${activity} session`,
        day,
      }

      const dayEntries = await getDayEntries(this.msg.author.id, this.challenge.ID);
      const dayEntry = dayEntries.filter(x => x.Day === day);
      const activityEntry = dayEntry.find(x => x.ValueType.includes(activity));

      if (activityEntry) {
        const valueType = activityEntry.ValueType;
        const amount = valueType.includes("10") ? "10min+" : "30min+";

        const question =
          oneLine`You already registered ${amount} ${activity} session on
          ${bold(month)} ${bold(day)}. Do you want to replace or add point on
          this day?`;

        const menu = new ButtonHandler(this.msg, question);

        menu.addButton(BLUE_BUTTON, "replace", () => {
          replaceDayEntry(
            this.msg.author.id,
            options.day,
            this.challenge.ID,
            options.challengeName,
            options.value,
          );

          this.msg.channel.send(`Successfully replaced`);
          this.showReplaceMessage(options);
        });

        menu.addCloseButton();
        await menu.run();

      } else {
        await this.registerDay(options);

      }

    });

    menu.addButton(RED_BUTTON, "multiple", async () => {

      const answer = await this.prompt.ask(
        oneLine`Please write the days of the month you want to upload
        yoga/meditation sessions for and seperate them with a space (example: 1
        2 3 4 ….)`
      );

      const month = this.month;
      const days = split(answer).map(x => parseInt(x));

      this.validateDays(days);

      const sessionAnswer = await this.prompt.ask(
        oneLine`Please write from left to right if the session was over 10
        minutes or 30 minutes for every day and seperate them with a space
        (example: 10 30 10 30 …)`
      );

      const sessions = split(sessionAnswer).map(x => parseInt(x));

      this.validateMultiRegister(days, sessions, `${activity} session`);

      for (const session of sessions) {
        if (session !== 30 && session !== 10) {
          throw new Error("only `30` or `10` session is allowed");
        }
      }

      await this.getMultiProof(`${activity} session`);

      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        const session = sessions[i] as (10 | 30);
        const challengeName: ChallengeName = `${activity}${session}`;

        const options: RegisterOptions = {
          value: 1,
          challengeName: challengeName,
          activityName: `${session}min+ ${activity} session`,
          day,
        }

        const dayEntries = await getDayEntries(this.msg.author.id, this.challenge.ID);
        const dayEntry = dayEntries.filter(x => x.Day === day);
        const yogaEntry = dayEntry.find(x => x.ValueType.includes(activity));

        if (yogaEntry) {
          const valueType = yogaEntry.ValueType;
          const amount = valueType.includes("10") ? "10min+" : "30min+";

          const question =
            oneLine`You already registered ${amount} ${activity} session on
            ${bold(month)} ${bold(day)}. Do you want to replace or add point on
            this day?`;

          const menu = new ButtonHandler(this.msg, question);

          menu.addButton(BLUE_BUTTON, "replace", () => {
            replaceDayEntry(
              this.msg.author.id,
              options.day,
              this.challenge.ID,
              options.challengeName,
              options.value,
            );

            this.msg.channel.send(`Successfully replaced`);
            this.showReplaceMessage(options);
          });


          menu.addCloseButton();
          await menu.run();

        } else {
          await this.registerDay(options);

        }
      }
    })

    menu.addCloseButton();
    await menu.run();
  }

  private async handleStrength() {

    const challengeName: ChallengeName = "strength";
    const question =
      oneLine`You can earn 12 point for 1 strength training over 30 minutes. You
      can upload 1 strength training every day. Do you want to upload a single
      day or multiple days?`;

    const menu = new ButtonHandler(this.msg, question);
    const activityName = "strength training";

    menu.addButton(BLUE_BUTTON, "single", async () => {

      const answer = await this.prompt.ask(
        oneLine`Please write the day of the month you want to upload a strength
        training for.`
      );

      const day = parseInt(answer);
      const count = 1;

      this.validateDay(day);

      await this.getProof(
        count,
        activityName,
        day,
        oneLine`Please upload a single screenshot of your wearable showing the
        date, duration of workout and heartrate.`,
      );

      await this.registerDay({
        value: count,
        challengeName: challengeName,
        activityName: activityName,
        day,
        replaceOnly: true,
      })

    })

    menu.addButton(RED_BUTTON, "multiple", async () => {

      const answer = await this.prompt.ask(
        oneLine`Please write the days of the month you want to upload strength
        training for and seperate them with a space \`(example: 1 2 3 4 ….)\``
      );

      const days = split(answer).map(x => parseInt(x));
      const count = 1;

      this.validateDays(days);

      await this.getMultiProof(activityName);

      const trainings = days.map(() => count);

      await this.registerDays(days, trainings, {
        challengeName: challengeName,
        activityName: activityName,
        replaceOnly: true,
      })
    })

    menu.addCloseButton();
    await menu.run();
  }

  private async handleSteps() {

    const question =
      oneLine`You can earn 1 point for every 1000 steps taken. Do you want to
      upload a single day or multiple days?`;

    const challengeName: ChallengeName = "steps";
    const menu = new ButtonHandler(this.msg, question);
    const activityName = "steps";

    menu.addButton(BLUE_BUTTON, "single", async () => {

      const answer = await this.prompt.ask(
        "Please write the day of the month you want to upload steps for."
      );

      const month = this.month;
      const day = parseInt(answer);

      this.validateDay(day);

      const stepsRespond = await this.prompt.ask(
        oneLine`Please write how many steps you want to upload for
        ${bold(month)} ${bold(day)}.`
      );
      const steps = parseInt(stepsRespond);

      if (Number.isNaN(steps)) {
        throw new Error(`Please only write the number of steps without any text.`);
      } else if (steps > 250_000) {
        throw new Error("This challenge capped at 250k steps");
      }

      await this.getProof(steps, "steps", day);

      await this.registerDay({
        value: steps,
        activityName: activityName,
        challengeName: challengeName,
        day,
      })

    })

    menu.addButton(RED_BUTTON, "multiple", async () => {

      const answer = await this.prompt.ask(
        oneLine`Please write the days of the month you want to upload steps for
        and seperate them with a space \`(example: 1 2 3 4 ….)\``
      );

      const days = split(answer).map(x => parseInt(x));

      this.validateDays(days);

      const stepsResponds = await this.prompt.ask(
        oneLine`Please write how many steps you want to upload for days
        ${days.join(" ")} in the right order, please seperate them with a space
        \`(example: 1456 2583 2847 8582 …)\``
      );

      const allSteps = split(stepsResponds).map(x => parseInt(x));

      this.validateMultiRegister(days, allSteps, "steps");

      for (const steps of allSteps) {

        if (Number.isNaN(steps)) {
          throw new Error(`invalid format "${steps}"`);
        } else if (steps > 250_000) {
          throw new Error("This challenge capped at 250k steps");
        }
      }

      await this.getMultiProof("steps");

      await this.registerDays(days, allSteps, {
        challengeName: challengeName,
        activityName: "steps",
      })

    })


    menu.addCloseButton();
    await menu.run();
  }

  private async handleCycling() {

    let challengeName: ChallengeName = "cyclingkm";
    let unit = "km";
    const question =
      oneLine`You can earn 1 point for every 2km or 1,24mi cycled. Do you want
      to upload a single day or multiple days?`;
    const menu = new ButtonHandler(this.msg, question);
    const activityName = "cycled";

    menu.addButton(BLUE_BUTTON, "single", async () => {

      const question = "Do you want to upload cycling distance in km or mi?";
      const menu = new ButtonHandler(this.msg, question);

      menu.addButton(BLUE_BUTTON, "km", () => {
        challengeName = "cyclingkm";
        unit = "km";
      });

      menu.addButton(RED_BUTTON, "mi", () => {
        challengeName = "cyclingmi";
        unit = "mi";
      });

      menu.addCloseButton();
      await menu.run();


      const day = parseInt(await this.prompt.ask(
        oneLine`Please write the day of the month you want to upload cycling
        (${unit}) for.`
      ));

      const month = this.month;

      this.validateDay(day);

      const distance = parseFloat(await this.prompt.ask(
        oneLine`Please write the distance (${unit}) you have cycled on
        ${bold(day)} ${bold(month)}`
      ));

      if (Number.isNaN(distance) || distance <= 0) {
        throw new Error("invalid distance")
      }

      await this.getProof(distance, activityName, day);

      await this.registerDay({
        value: distance,
        challengeName,
        activityName,
        day,
      });

    });

    menu.addButton(RED_BUTTON, "multiple", async () => {

      const question = "Do you want to upload cycling distance in km or mi?";
      const menu = new ButtonHandler(this.msg, question);

      menu.addButton(BLUE_BUTTON, "km", () => {
        challengeName = "cyclingkm";
        unit = "km";
      });

      menu.addButton(RED_BUTTON, "mi", () => {
        challengeName = "cyclingmi";
        unit = "mi";
      });

      menu.addCloseButton();
      await menu.run();

      const answer = await this.prompt.ask(
        oneLine`Please write the days of the month you want to upload cycling
        (${unit}) for and seperate them with a space \`(example: 1 2 3 4 ….)\``,
      );

      const days = split(answer).map(x => parseInt(x));

      this.validateDays(days);

      const cyclingResponds = await this.prompt.ask(
        oneLine`Please write how many cycling (${bold(unit)}) you want to upload
        for days ${days.join(" ")} in the right order, please seperate them with
        a space \`(example: 5,27 20,54 7,25 8,55 …)\``
      );

      const allCycling = split(cyclingResponds).map(x => parseFloat(x));

      this.validateMultiRegister(days, allCycling, "cycling");

      for (const cycling of allCycling) {

        if (Number.isNaN(cycling)) {
          throw new Error(`invalid format "${cycling}"`);
        }
      }

      await this.getMultiProof("cycling");

      await this.registerDays(days, allCycling, {
        challengeName: challengeName,
        activityName: `${unit} cycled`,
      });
    });

    menu.addCloseButton();
    await menu.run();
  }
}
