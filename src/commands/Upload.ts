import Command from "../internals/Command";
import { Message } from "discord.js";
import { CancelledInputError, Prompt } from "../internals/Prompt";
import {
  BLACK_BUTTON,
  BLUE_BUTTON,
  bold,
  getXp,
  RED_BUTTON,
  WHITE_BUTTON,
  split,
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
  month: string;
  day: number;
  conversionRate: number;
};

export default class Upload extends Command {
  name = "upload";
  aliases = ["up"];
  msg!: Message;
  convertTable!: Map<string, number>;
  challenge!: Challenge;

  async exec(msg: Message) {

    const channelID = client.isDev ? "859483633534238762" : msg.channel.id;
    this.msg = msg;
    this.challenge = await getChallengeByChannelID(channelID);
    this.convertTable = await getConvertTable();

    if (!this.challenge) {
      return msg.channel.send("wrong channel");
    }

    const question = "Please select a category to upload for points";
    const menu = new ButtonHandler(msg, question);

    menu.addButton(BLUE_BUTTON, "steps", () => this.handleSteps());
    menu.addButton(RED_BUTTON, "cycling", () => this.handleCycling());
    menu.addButton(WHITE_BUTTON, "strength", () => this.handleStrength());
    menu.addButton(BLACK_BUTTON, "yoga", () => this.handleYoga());
    menu.addCloseButton();

    try {

      await menu.run();

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

  private validateDays(days: number[], maxDay: number) {
    for (const day of days) {
      this.validateDay(day, maxDay);
    }
  }

  private showSuccessMessage(data: MessageOptions) {

    const points = Math.round(data.conversionRate * data.value);
    const xp = getXp(points);
    const amount = data.value === 1 ? "a" : bold(data.value);

    const text =
      oneLine`You have registered ${amount} ${data.activityName} on
      ${bold(data.month)} ${bold(data.day)} and earned ${bold(points)} monthly
      points + ${bold(xp)} permanent XP!`;

    this.msg.channel.send(text);
  }

  private showAddMessage(data: MessageOptions) {

    const points = Math.round(data.conversionRate * data.value);
    const xp = getXp(points);
    const amount = data.value === 1 ? "a" : bold(data.value);

    const text =
      oneLine`You have registered ${amount} additional
      ${data.activityName} on ${bold(data.month)} ${bold(data.day)} and earned
      ${bold(points)} monthly points + ${bold(xp)} permanent XP!`;

    this.msg.channel.send(text);
  }


  private showReplaceMessage(data: MessageOptions) {

    const points = Math.round(data.conversionRate * data.value);
    const xp = getXp(points);
    const amount = data.value === 1 ? "a" : bold(data.value);

    const text =
      oneLine`You have registered ${amount} ${data.activityName} on
      ${bold(data.month)} ${bold(data.day)} and earned ${bold(points)} monthly
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

      const { month, day, activityName, value } = options;
      const err = e as OverlapError;
      const amount = value === 1 ? "a" : bold(err.dayEntry.Value);
      const question = 
        oneLine`You already registered ${amount} ${activityName} on
        ${bold(month)} ${bold(day)}. Do you want to replace or add
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

  private async handleYoga() {
    
    const activity = "yoga";
    const question = oneLine`You can earn 5 points for yoga over 10
    minutes. You can earn 10 points for yoga over 30 minutes. Do
    you want to upload a single day or multiple days?`;

    const menu = new ButtonHandler(this.msg, question);
    const prompt = new Prompt(this.msg, { cancelKeyword: ["cancel"] });

    menu.addButton(BLUE_BUTTON, "single", async () => {

      const answer = await prompt.ask(
        oneLine`Please write the day of the month you want to upload a yoga
        session for.`
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
        "yoga session",
        month,
        day,
        oneLine`Please upload a single screenshot of your wearable showing the
        date, duration of workout and heartrate. Alternatively, a photo of the
        yoga spot with mentioned elapsed time and/or additional information can
        be accepted.`,
      );

      const options: MessageOptions = {
        value: 1,
        valueType: challengeName,
        activityName: `${session} minutes yoga session`,
        conversionRate,
        month,
        day,
      }

      const dayEntries = await getDayEntries(this.msg.author.id, this.challenge.ID);
      const dayEntry = dayEntries.filter(x => x.Day === day);
      const yogaEntry = dayEntry.find(x => x.ValueType.includes("yoga"));

      if (yogaEntry) {
        const valueType = yogaEntry.ValueType;
        const amount = valueType === "yoga10" ? "10min+" : "30min+";

        const question = 
          oneLine`You already registered ${amount} yoga session on
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
        month,
        day,
      }

      await this.registerDay(successOptions);

    })

    menu.addButton(RED_BUTTON, "multiple", async () => {

      const answer = await prompt.ask(
        oneLine`Please write the days of the month you want to upload strength
        training for and seperate them with a space \`(example: 1 2 3 4 ….)\``
      );

      const days = answer.split(/\s+/).map(x => parseInt(x));
      const date = DateTime.local(this.challenge.Year, this.challenge.Month - 1);
      const maxDay = date.daysInMonth;
      const month = date.monthLong;
      const count = 1;

      this.validateDays(days, maxDay);
      
      await this.getMultiProof(prompt, activityName);


      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        const successOptions: MessageOptions = {
          value: count,
          valueType: challengeName,
          activityName: activityName,
          conversionRate,
          month,
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

      const successOptions: MessageOptions = {
        value: steps,
        activityName: activityName,
        valueType: challengeName,
        conversionRate,
        month,
        day,
      }

      await this.registerDay(successOptions);

    })

    menu.addButton(RED_BUTTON, "multiple", async () => {

      const answer = await prompt.ask(
        oneLine`Please write the days of the month you want to upload steps for
        and seperate them with a space \`(example: 1 2 3 4 ….)\``
      );

      const days = split(answer).map(x => parseInt(x));
      const date = DateTime.local(this.challenge.Year, this.challenge.Month - 1);
      const maxDay = date.daysInMonth;
      const month = date.monthLong;

      this.validateDays(days, maxDay);

      const stepsResponds = await prompt.ask(
        oneLine`Please write how many steps you want to upload for days
        ${days.join(" ")} in the right order, please seperate them with a space
        \`(example: 1456 2583 2847 8582 …)\``
      );

      const allSteps = split(stepsResponds).map(x => parseInt(x));

      if (allSteps.length !== days.length) {
        throw new Error(
          oneLine`You are uploading for ${days.length} days but only
          ${allSteps.length} steps are given.`
        );
      }

      for (const stepsRespond of allSteps) {

        const steps = stepsRespond;

        if (Number.isNaN(steps)) {
          throw new Error(`invalid format "${steps}"`);
        } else if (steps > 250_000) {
          throw new Error("This challenge capped at 250k steps");
        }
      }

      await this.getMultiProof(prompt, "steps");

      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        const steps = allSteps[i];
        const successOptions: MessageOptions = {
          value: steps,
          valueType: challengeName,
          activityName: "steps",
          conversionRate,
          month,
          day,
        }

        await this.registerDay(successOptions);
      }

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
    const lookupID = `${challengeName}-${this.challenge.ID}`;
    const conversionRate = this.convertTable.get(lookupID)!;
    const activityName = "cycled";

    if (!conversionRate)
      throw new Error(`conversion rate does not exists for "${lookupID}"`);

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

      const successOptions: MessageOptions = {
        value: distance,
        valueType: challengeName,
        activityName: activityName,
        conversionRate,
        month,
        day,
      }

      await this.registerDay(successOptions);

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

      const answer = await prompt.ask(
        oneLine`Please write the days of the month you want to upload cycling
        (${unit}) for and seperate them with a space \`(example: 1 2 3 4 ….)\``,
      );

      const days = split(answer).map(x => parseInt(x));
      const date = DateTime.local(this.challenge.Year, this.challenge.Month - 1);
      const maxDay = date.daysInMonth;
      const month = date.monthLong;

      this.validateDays(days, maxDay);

      const cyclingResponds = await prompt.ask(
        oneLine`Please write how many cycling (${bold(unit)}) you want to upload
        for days ${days.join(" ")} in the right order, please seperate them with
        a space \`(example: 5,27 20,54 7,25 8,55 …)\``
      );

      const allCycling = split(cyclingResponds).map(x => parseFloat(x));

      if (allCycling.length !== days.length) {
        throw new Error(
          oneLine`You are uploading for ${days.length} days but only
          ${allCycling.length} cycle distances are given.`
        );
      }

      for (const cyclingRespond of allCycling) {

        const cycling = cyclingRespond;

        if (Number.isNaN(cycling)) {
          throw new Error(`invalid format "${cycling}"`);
        }
      }

      await this.getMultiProof(prompt, "cycling");

      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        const cycling = allCycling[i];
        const successOptions: MessageOptions = {
          value: cycling,
          valueType: challengeName,
          activityName: `${unit} cycled`,
          conversionRate,
          month,
          day,
        }

        await this.registerDay(successOptions);
      }
    });

    menu.addCloseButton();
    await menu.run();
  }
}
