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

type MessageOptions = {
  value: number;
  valueType: ChallengeName;
  activityName: string;
  day: number;
  conversionRate: number;
};

export default class Upload extends Command {
  name = "upload";
  aliases = ["up"];
  msg!: Message;
  convertTable!: Map<string, number>;
  challenge!: Challenge;
  maxDay!: number;
  month!: string;

  async exec(msg: Message, args: string[]) {

    const channelID = client.isDev ? "859483633534238762" : msg.channel.id;
    this.msg = msg;
    this.challenge = await getChallengeByChannelID(channelID);
    this.convertTable = await getConvertTable();

    if (!this.challenge) {
      return msg.channel.send("wrong channel");
    }

    const date = DateTime.local(this.challenge.Year, this.challenge.Month - 1);
    this.maxDay = date.daysInMonth;
    this.month = date.monthLong;

    const categoryHandler = new Map<string, () => Promise<void>>();
    categoryHandler.set("steps", () => this.handleSteps());
    categoryHandler.set("cycling", () => this.handleCycling());
    categoryHandler.set("strength", () => this.handleStrength());
    categoryHandler.set("yoga", () => this.handleYogaAndMeditation("yoga"));
    categoryHandler.set("meditation", () => this.handleYogaAndMeditation("meditation"));
    categoryHandler.set("rowing", () => this.handleRowing());
    categoryHandler.set("othercardio", () => this.handleOtherCardio());

    let handler: undefined | (() => Promise<void>);

    if (args[0]) {

      const category = args[0];
      const cb = categoryHandler.get(category);

      if (!cb) {
        const categories = [...categoryHandler.keys()]
          .map(x => inlineCode(x))
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

  private validateDays(days: number[]) {
    for (const day of days) {
      this.validateDay(day, this.maxDay);
    }
  }

  private validateNumber(num: number) {
    if (Number.isNaN(num)) {
      throw new Error(`${inlineCode(num)} is not valid number type`);
    }
  }

  private showSuccessMessage(data: MessageOptions) {

    const points = Math.round(data.conversionRate * data.value);
    const xp = getXp(points);
    const amount = data.value === 1 ? "a" : bold(data.value);

    const text =
      oneLine`You have registered ${amount} ${data.activityName} on
      ${bold(this.month)} ${bold(data.day)} and earned ${bold(points)} monthly
      points + ${bold(xp)} permanent XP!`;

    this.msg.channel.send(text);
  }

  private showAddMessage(data: MessageOptions) {

    const points = Math.round(data.conversionRate * data.value);
    const xp = getXp(points);
    const amount = data.value === 1 ? "a" : bold(data.value);

    const text =
      oneLine`You have registered ${amount} additional
      ${data.activityName} on ${bold(this.month)} ${bold(data.day)} and earned
      ${bold(points)} monthly points + ${bold(xp)} permanent XP!`;

    this.msg.channel.send(text);
  }


  private showReplaceMessage(data: MessageOptions) {

    const points = Math.round(data.conversionRate * data.value);
    const xp = getXp(points);
    const amount = data.value === 1 ? "a" : bold(data.value);

    const text =
      oneLine`You have registered ${amount} ${data.activityName} on
      ${bold(this.month)} ${bold(data.day)} and earned ${bold(points)} monthly
      points + ${bold(xp)} permanent XP! Your previous gained points for this
      day have been removed.`;

    this.msg.channel.send(text);
  }

  private validateDay(day: number, maxDay: number) {
      if (Number.isNaN(day) || day > maxDay || day <= 0) {
        throw new Error(
          oneLine`Please only write the day of the the month (Example: use "5"
          for the 5th day in the month).`
        );
      }
  }

  private async getProof(
    prompt: Prompt,
    value: number,
    activity: string,
    month: string,
    day: number,
    question?: string,
  ) {

    try {

      const collected = await prompt.collect(
        question ||
        oneLine`Please upload a single screenshot of your wearable showing
        ${bold(value)} ${activity} on ${bold(month)} ${bold(day)}.`,
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

  private async getMultiProof(prompt: Prompt, activity: string) {

    try {

      const collected = await prompt.collect(
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

  private async registerDay(options: MessageOptions) {

    try {

      await registerDayEntry(
        this.msg.author.id,
        options.day,
        this.challenge.ID,
        options.valueType,
        options.value,
      );

      this.showSuccessMessage(options);

    } catch (e: unknown) {

      const { day, activityName, value } = options;
      const err = e as OverlapError;
      const amount = value === 1 ? "a" : bold(err.dayEntry.Value);
      const question =
        oneLine`You already registered ${amount} ${activityName} on
        ${bold(this.month)} ${bold(day)}. Do you want to replace or add
        point on this day?`;

      const menu = new ButtonHandler(this.msg, question);

      menu.addButton(BLUE_BUTTON, "replace", () => {
        replaceDayEntry(
          this.msg.author.id,
          options.day,
          this.challenge.ID,
          options.valueType,
          options.value,
        );

        this.msg.channel.send(`Successfully replaced`);
        this.showReplaceMessage(options);
      });

      menu.addButton(RED_BUTTON, "add points", () => {
        addDayEntry(
          this.msg.author.id,
          options.day,
          this.challenge.ID,
          options.valueType,
          options.value,
        );

        this.msg.channel.send(`Successfully added`);
        this.showAddMessage(options);
      });

      menu.addCloseButton();
      await menu.run();
    }
  }

  private async registerDays(
    days: number[],
    values: number[],
    messageOptions: Omit<MessageOptions, "value" | "day">,
  ) {

      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        const value = values[i];
        const successOptions: MessageOptions = {
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

  private async handleOtherCardio() {

    const challengeName = "othercardio";
    const question = oneLine`You can earn 0,2 points for every minute of other
    cardio. Only cardio with average heartrate of 125+ can be uploaded. The
    cardio should not fit other categories or already award steps in a
    reasonable way (running is already awarded by steps).`;

    const activityName = " minutes other cardio session";
    const lookupID = `${challengeName}-${this.challenge.ID}`;
    const conversionRate = this.convertTable.get(lookupID);

    if (conversionRate === undefined)
      throw new Error("no conversion rate found");

    const menu = new ButtonHandler(this.msg, question);
    const prompt = new Prompt(this.msg, { cancelKeyword: ["cancel"] });

    menu.addButton(BLUE_BUTTON, "single", async () => {

      const answer = await prompt.ask(
        oneLine`Please write the day of the month you want to upload other
        cardio for.`
      );

      const date = DateTime.local(this.challenge.Year, this.challenge.Month - 1);
      const maxDay = date.daysInMonth;
      const month = date.monthLong;
      const day = parseInt(answer);

      this.validateDay(day, maxDay);

      const minutes = parseInt(await prompt.ask(
        oneLine`Please write how many full minutes of other cardio (no decimals)
        you want to upload for ${month} ${day}.`
      ));

      this.validateNumber(minutes);

      await this.getProof(
        prompt,
        minutes,
        activityName,
        month,
        day,
        oneLine`Please upload a single screenshot of your wearable showing
        ${bold(minutes)} minutes of other cardio with average heartrate above 125+ on
        ${bold(month)} ${bold(day)}.`,
      );

      const options: MessageOptions = {
        value: minutes,
        activityName,
        valueType: challengeName,
        conversionRate,
        day,
      }

      await this.registerDay(options);

    });

    menu.addButton(RED_BUTTON, "multiple", async () => {

      const answer = await prompt.ask(
        oneLine`Please write the days of the month you want to upload other
        cardio for and seperate them with a space (example: 1 2 3 4 ….)`
      );

      const days = split(answer).map(x => parseInt(x));

      this.validateDays(days);

      const minutesAnswer = await prompt.ask(
        oneLine`Please write how many full minutes of other cardio (no decimals)
        you want to upload for days ${bold(days.join(", "))} in the right order,
        please seperate them with a space \`(example: 60 90 42 30 …)\``
      );

      const sessions = split(minutesAnswer).map(x => parseInt(x));

      this.validateMultiRegister(days, sessions, activityName);

      await this.getMultiProof(prompt, activityName);

      await this.registerDays(days, sessions, {
        valueType: "othercardio",
        activityName,
        conversionRate,
      });
    })

    menu.addCloseButton();
    await menu.run();
  }

  private async handleRowing() {

    const question = oneLine`You can earn 1 point for every 1km or 0,62mi rowed.
      Do you want to upload a single day or multiple days?`;

    const menu = new ButtonHandler(this.msg, question);
    const prompt = new Prompt(this.msg, { cancelKeyword: ["cancel"] });
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

      const lookupID = `${challengeName}-${this.challenge.ID}`;
      const conversionRate = this.convertTable.get(lookupID)!;

      if (!conversionRate)
        throw new Error(`conversion rate does not exists for "${lookupID}"`);

      const day = parseInt(await prompt.ask(
        oneLine`Please write the day of the month you want to upload cycling
        (${unit}) for.`
      ));

      const date = DateTime.local(this.challenge.Year, this.challenge.Month - 1);
      const maxDay = date.daysInMonth;
      const month = date.monthLong;

      this.validateDay(day, maxDay);

      const distance = parseFloat(await prompt.ask(
        oneLine`Please write the distance (${unit}) you have cycled on
        ${bold(day)} ${bold(month)}`
      ));

      if (Number.isNaN(distance) || distance <= 0) {
        throw new Error("invalid distance")
      }

      await this.getProof(prompt, distance, activityName, month, day);

      const messageOptions: MessageOptions = {
        value: distance,
        valueType: challengeName,
        activityName: activityName,
        conversionRate,
        day,
      }

      await this.registerDay(messageOptions);

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

      const lookupID = `${challengeName}-${this.challenge.ID}`;
      const conversionRate = this.convertTable.get(lookupID)!;

      if (!conversionRate)
        throw new Error(`conversion rate does not exists for "${lookupID}"`);

      const answer = await prompt.ask(
        oneLine`Please write the days of the month you want to rowing ${unit}
        steps for and seperate them with a space \`(example: 1 2 3 4 ….)\``
      );

      const days = split(answer).map(x => parseFloat(x));

      this.validateDays(days);

      const rowsRespond = await prompt.ask(
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

      await this.getMultiProof(prompt, `${unit} rowed`);

      await this.registerDays(days, rows, {
        valueType: challengeName,
        activityName: `${unit} rowed`,
        conversionRate,
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
    const prompt = new Prompt(this.msg, { cancelKeyword: ["cancel"] });

    menu.addButton(BLUE_BUTTON, "single", async () => {

      const answer = await prompt.ask(
        oneLine`Please write the day of the month you want to upload a
        ${activity} session for.`
      );

      const date = DateTime.local(this.challenge.Year, this.challenge.Month - 1);
      const maxDay = date.daysInMonth;
      const month = date.monthLong;
      const day = parseInt(answer);
      let session: 10 | 30 = 10;

      this.validateDay(day, maxDay);

      const sessionQuestion = "Was your session over 10 minutes or 30 minutes?";
      const menu = new ButtonHandler(this.msg, sessionQuestion);

      menu.addButton(BLUE_BUTTON, "10 minutes", () => { session = 10; });
      menu.addButton(RED_BUTTON, "30 minutes", () => { session = 30; });

      const challengeName: ChallengeName = `${activity}${session}`;
      const lookupID = `${challengeName}-${this.challenge.ID}`;
      const conversionRate = this.convertTable.get(lookupID);

      if (!conversionRate)
        throw new Error(`conversion rate does not exists for "${lookupID}"`);

      menu.addCloseButton();
      await menu.run();

      await this.getProof(
        prompt,
        1,
        `${activity} session`,
        month,
        day,
        oneLine`Please upload a single screenshot of your wearable showing the
        date, duration of workout and heartrate. Alternatively, a photo of the
        ${activity} spot with mentioned elapsed time and/or additional
        information can be accepted.`,
      );

      const options: MessageOptions = {
        value: 1,
        valueType: challengeName,
        activityName: `${session} minutes ${activity} session`,
        conversionRate,
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
            options.valueType,
            options.value,
          );

          this.msg.channel.send(`Successfully replaced`);
          this.showReplaceMessage(options);
        });

        menu.addButton(RED_BUTTON, "add points", () => {
          addDayEntry(
            this.msg.author.id,
            options.day,
            this.challenge.ID,
            options.valueType,
            options.value,
          );

          this.msg.channel.send(`Successfully added`);
          this.showAddMessage(options);
        });

        menu.addCloseButton();
        await menu.run();

      } else {
        await this.registerDay(options);

      }

    });

    menu.addButton(RED_BUTTON, "multiple", async () => {

      const answer = await prompt.ask(
        oneLine`Please write the days of the month you want to upload
        yoga/meditation sessions for and seperate them with a space (example: 1
        2 3 4 ….)`
      );

      const date = DateTime.local(this.challenge.Year, this.challenge.Month - 1);
      const month = date.monthLong;
      const days = split(answer).map(x => parseInt(x));

      this.validateDays(days);

      const sessionAnswer = await prompt.ask(
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

      await this.getMultiProof(prompt, `${activity} session`);

      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        const session = sessions[i] as (10 | 30);
        const challengeName: ChallengeName = `${activity}${session}`;
        const lookupID = `${challengeName}-${this.challenge.ID}`;
        const conversionRate = this.convertTable.get(lookupID);

        if (!conversionRate) {
          throw new Error(`conversion rate does not exists for "${lookupID}"`);
        }

        const options: MessageOptions = {
          value: 1,
          valueType: challengeName,
          activityName: `${session}min+ ${activity} session`,
          conversionRate,
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
              options.valueType,
              options.value,
            );

            this.msg.channel.send(`Successfully replaced`);
            this.showReplaceMessage(options);
          });

          menu.addButton(RED_BUTTON, "add points", () => {
            addDayEntry(
              this.msg.author.id,
              options.day,
              this.challenge.ID,
              options.valueType,
              options.value,
            );

            this.msg.channel.send(`Successfully added`);
            this.showAddMessage(options);
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
    const prompt = new Prompt(this.msg, { cancelKeyword: ["cancel"] });
    const lookupID = `${challengeName}-${this.challenge.ID}`;
    const conversionRate = this.convertTable.get(lookupID);
    const activityName = "strength training";

    if (!conversionRate)
      throw new Error(`conversion rate does not exists for "${lookupID}"`);

    menu.addButton(BLUE_BUTTON, "single", async () => {

      const answer = await prompt.ask(
        oneLine`Please write the day of the month you want to upload a strength
        training for.`
      );

      const date = DateTime.local(this.challenge.Year, this.challenge.Month - 1);
      const maxDay = date.daysInMonth;
      const month = date.monthLong;
      const day = parseInt(answer);
      const count = 1;

      this.validateDay(day, maxDay);

      await this.getProof(
        prompt,
        count,
        activityName,
        month,
        day,
        oneLine`Please upload a single screenshot of your wearable showing the
        date, duration of workout and heartrate.`,
      );

      const successOptions: MessageOptions = {
        value: count,
        valueType: challengeName,
        activityName: activityName,
        conversionRate,
        day,
      }

      await this.registerDay(successOptions);

    })

    menu.addButton(RED_BUTTON, "multiple", async () => {

      const answer = await prompt.ask(
        oneLine`Please write the days of the month you want to upload strength
        training for and seperate them with a space \`(example: 1 2 3 4 ….)\``
      );

      const days = split(answer).map(x => parseInt(x));
      const count = 1;

      this.validateDays(days);

      await this.getMultiProof(prompt, activityName);


      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        const successOptions: MessageOptions = {
          value: count,
          valueType: challengeName,
          activityName: activityName,
          conversionRate,
          day,
        }

        await this.registerDay(successOptions);
      }
    })

    menu.addCloseButton();
    await menu.run();
  }

  private async handleSteps() {

    const challengeName: ChallengeName = "steps";
    const question =
      oneLine`You can earn 1 point for every 1000 steps taken. Do you want to
      upload a single day or multiple days?`;
    const menu = new ButtonHandler(this.msg, question);
    const prompt = new Prompt(this.msg, { cancelKeyword: ["cancel"] });
    const lookupID = `${challengeName}-${this.challenge.ID}`;
    const conversionRate = this.convertTable.get(lookupID);
    const activityName = "steps";

    if (!conversionRate)
      throw new Error(`conversion rate does not exists for "${lookupID}"`);

    menu.addButton(BLUE_BUTTON, "single", async () => {

      const answer = await prompt.ask(
        "Please write the day of the month you want to upload steps for."
      );

      const date = DateTime.local(this.challenge.Year, this.challenge.Month - 1);
      const maxDay = date.daysInMonth;
      const month = date.monthLong;
      const day = parseInt(answer);

      this.validateDay(day, maxDay);

      const stepsRespond = await prompt.ask(
        oneLine`Please write how many steps you want to upload for
        ${bold(month)} ${bold(day)}.`
      );
      const steps = parseInt(stepsRespond);

      if (Number.isNaN(steps)) {
        throw new Error(`Please only write the number of steps without any text.`);
      } else if (steps > 250_000) {
        throw new Error("This challenge capped at 250k steps");
      }

      await this.getProof(prompt, steps, "steps", month, day);

      const options: MessageOptions = {
        value: steps,
        activityName: activityName,
        valueType: challengeName,
        conversionRate,
        day,
      }

      await this.registerDay(options);

    })

    menu.addButton(RED_BUTTON, "multiple", async () => {

      const answer = await prompt.ask(
        oneLine`Please write the days of the month you want to upload steps for
        and seperate them with a space \`(example: 1 2 3 4 ….)\``
      );

      const days = split(answer).map(x => parseInt(x));

      this.validateDays(days);

      const stepsResponds = await prompt.ask(
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

      await this.getMultiProof(prompt, "steps");

      await this.registerDays(days, allSteps, {
        valueType: challengeName,
        activityName: "steps",
        conversionRate,
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
    const prompt = new Prompt(this.msg, { cancelKeyword: ["cancel"] });
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

      const lookupID = `${challengeName}-${this.challenge.ID}`;
      const conversionRate = this.convertTable.get(lookupID)!;

      if (!conversionRate)
        throw new Error(`conversion rate does not exists for "${lookupID}"`);

      const day = parseInt(await prompt.ask(
        oneLine`Please write the day of the month you want to upload cycling
        (${unit}) for.`
      ));

      const date = DateTime.local(this.challenge.Year, this.challenge.Month - 1);
      const maxDay = date.daysInMonth;
      const month = date.monthLong;

      this.validateDay(day, maxDay);

      const distance = parseFloat(await prompt.ask(
        oneLine`Please write the distance (${unit}) you have cycled on
        ${bold(day)} ${bold(month)}`
      ));

      if (Number.isNaN(distance) || distance <= 0) {
        throw new Error("invalid distance")
      }

      await this.getProof(prompt, distance, activityName, month, day);

      const options: MessageOptions = {
        value: distance,
        valueType: challengeName,
        activityName: activityName,
        conversionRate,
        day,
      }

      await this.registerDay(options);

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

      const lookupID = `${challengeName}-${this.challenge.ID}`;
      const conversionRate = this.convertTable.get(lookupID)!;

      if (!conversionRate)
        throw new Error(`conversion rate does not exists for "${lookupID}"`);

      const answer = await prompt.ask(
        oneLine`Please write the days of the month you want to upload cycling
        (${unit}) for and seperate them with a space \`(example: 1 2 3 4 ….)\``,
      );

      const days = split(answer).map(x => parseInt(x));

      this.validateDays(days);

      const cyclingResponds = await prompt.ask(
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

      await this.getMultiProof(prompt, "cycling");

      await this.registerDays(days, allCycling, {
        valueType: challengeName,
        activityName: `${unit} cycled`,
        conversionRate,
      });
    });

    menu.addCloseButton();
    await menu.run();
  }
}
