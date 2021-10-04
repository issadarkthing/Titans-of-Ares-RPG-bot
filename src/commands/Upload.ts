import Command from "../internals/Command";
import { Message } from "discord.js";
import { Prompt } from "../internals/Prompt";
import { BLUE_BUTTON, bold, getXp, RED_BUTTON } from "../internals/utils";
import { ButtonHandler } from "../internals/ButtonHandler";
import { oneLine } from "common-tags";
import { client } from "../main";
import { registerDayEntry, ChallengeName, getChallengeByChannelID, getConvertTable, replaceDayEntry, addDayEntry, Challenge, OverlapError } from "../db/monthlyChallenge";
import { DateTime } from "luxon";

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
    menu.addCloseButton();

    try {
      await menu.run();
    } catch (err) {
      msg.channel.send(err.message);
    }
  }

  private async handleSteps() {

    const challengeName: ChallengeName = "steps";
    const question = "Do you want to upload a single day or multiple days?";
    const menu = new ButtonHandler(this.msg, question);
    const prompt = new Prompt(this.msg);
    const lookupID = `${challengeName}-${this.challenge.ID}`;
    const conversionRate = this.convertTable.get(lookupID);

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

      if (Number.isNaN(day) || day > maxDay) {
        this.msg.channel.send(
          oneLine`Please only write the day of the the month (Example: use "5"
          for the 5th day in the month).`
        );
        return;
      }

      const stepsRespond = await prompt.ask(
        oneLine`Please write how many steps you want to upload for
        ${bold(month)} ${bold(day)}.`
      );
      const steps = parseInt(stepsRespond);

      if (Number.isNaN(steps)) {
        this.msg.channel.send(`Please only write the number of steps without any text.`);
        return;
      } else if (steps > 250_000) {
        this.msg.channel.send("This challenge capped at 250k steps");
        return;
      }

      const respond = await prompt.collect(
        oneLine`Please upload a single screenshot of your wearable showing
        ${bold(steps)} steps on ${bold(month)} ${bold(day)}.`
      );

      const proof = respond.attachments.first();

      if (!proof) {
        this.msg.channel.send("No screenshot provided. Upload process failed.");
        return;
      }

      const showSuccessMessage = () => {
        const points = Math.round(conversionRate * steps);
        const xp = getXp(points);

        let text =
          oneLine`You have registered ${bold(steps)} steps on ${bold(month)}
        ${bold(day)} and earned ${bold(points)} monthly points + ${bold(xp)}
        permanent XP!`;

        text += "\n";

        text +=
          oneLine`For a total overview of your uploads this month, use
        \`${client.prefix}progress\``;

        this.msg.channel.send(text);
      }

      try {

        await registerDayEntry(this.msg.author.id, day, this.challenge.ID, challengeName, steps);
        showSuccessMessage();

      } catch (e: unknown) {

        const err = e as OverlapError;
        const question = 
          oneLine`You already registered ${bold(err.dayEntry.Value)} steps on
          ${bold(month)} ${bold(day)}. Do you want to replace or add point on
          this day?`;

        const menu = new ButtonHandler(this.msg, question);

        menu.addButton(BLUE_BUTTON, "replace", () => {
          replaceDayEntry(this.msg.author.id, day, this.challenge.ID, challengeName, steps);
          this.msg.channel.send(`Successfully replaced`);
          showSuccessMessage();
        });

        menu.addButton(RED_BUTTON, "add points", () => {
          addDayEntry(this.msg.author.id, day, this.challenge.ID, challengeName, steps);
          this.msg.channel.send(`Successfully added`);
          showSuccessMessage();
        });

        menu.addCloseButton();
        await menu.run();
      }

    })

    menu.addButton(RED_BUTTON, "multiple", async () => {

      const answer = await prompt.ask(
        oneLine`Please write the days of the month you want to upload steps for
        and seperate them with a space \`(example: 1 2 3 4 ….)\``
      );

      const days = answer.split(/\s+/).map(x => parseInt(x));
      const date = DateTime.local(this.challenge.Year, this.challenge.Month - 1);
      const maxDay = date.daysInMonth;
      const month = date.monthLong;

      for (const day of days) {

        if (Number.isNaN(day) || day > maxDay) {
          this.msg.channel.send(
            oneLine`Please only write the day of the the month (Example: use "5"
            for the 5th day in the month).`
          );
          return;
        }
      }

      const stepsResponds = await prompt.ask(
        oneLine`Please write how many steps you want to upload for days
        ${days.join(" ")} in the right order, please seperate them with a space
        \`(example: 1456 2583 2847 8582 …)\``
      );

      const allSteps = stepsResponds.split(/\s+/).map(x => parseInt(x));

      if (allSteps.length !== days.length) {
        this.msg.channel.send(
          oneLine`You are uploading for ${days.length} days but only
          ${allSteps.length} steps are given.`
        );
        return;
      }

      for (const stepsRespond of allSteps) {

        const steps = stepsRespond;

        if (Number.isNaN(steps)) {
          this.msg.channel.send(`invalid format "${steps}"`);
          return;
        } else if (steps > 250_000) {
          this.msg.channel.send("This challenge capped at 250k steps");
          return;
        }
      }


      await prompt.collect(
        oneLine`Please upload one or more screenshots proving your steps for
        these days of the month.`,
        { max: days.length },
      );


      const showSuccessMessage = (steps: number, day: number) => {
        const points = Math.round(conversionRate * steps);
        const xp = getXp(points);

        const text =
          oneLine`You have registered ${bold(steps)} steps on ${bold(month)}
          ${bold(day)} and earned ${bold(points)} monthly points + ${bold(xp)}
          permanent XP!`;

        this.msg.channel.send(text);
      }

      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        const steps = allSteps[i];

        try {

          await registerDayEntry(this.msg.author.id, day, this.challenge.ID, challengeName, steps);
          showSuccessMessage(steps, day);

        } catch (e: unknown) {

          const err = e as OverlapError;
          const question = 
            oneLine`You already registered ${bold(err.dayEntry.Value)} steps on
            ${bold(month)} ${bold(day)}. Do you want to replace or add point on
            this day?`; 

          const menu = new ButtonHandler(this.msg, question);

          menu.addButton(BLUE_BUTTON, "replace", () => {
            replaceDayEntry(this.msg.author.id, day, this.challenge.ID, challengeName, steps);
            this.msg.channel.send(`Successfully replaced`);
            showSuccessMessage(steps, day);
          });

          menu.addButton(RED_BUTTON, "add points", () => {
            addDayEntry(this.msg.author.id, day, this.challenge.ID, challengeName, steps);
            this.msg.channel.send(`Successfully added`);
            showSuccessMessage(steps, day);
          });

          menu.addCloseButton();
          await menu.run();
        }
      }

      this.msg.channel.send(
        oneLine`For a total overview of your uploads this month, use
        \`${client.prefix}progress\``
      );

    })


    menu.addCloseButton();
    await menu.run();
  }
}