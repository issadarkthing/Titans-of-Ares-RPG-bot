import Command from "../internals/Command";
import { Message } from "discord.js";
import { Prompt } from "../internals/Prompt";
import { BLUE_BUTTON, getXp, RED_BUTTON } from "../internals/utils";
import { ButtonHandler } from "../internals/ButtonHandler";
import { oneLine } from "common-tags";
import { client } from "../main";
import { registerDayEntry, ChallengeName, getChallengeByChannelID, getConvertTable, replaceDayEntry, addDayEntry } from "../db/monthlyChallenge";
import { DateTime } from "luxon";

export default class Upload extends Command {
  name = "upload";
  aliases = ["up"];

  async exec(msg: Message) {

    const channelID = client.isDev ? "859483633534238762" : msg.channel.id;
    const challenge = await getChallengeByChannelID(channelID);
    const challengeID = challenge.ID;
    const convertTable = await getConvertTable();

    if (!challengeID) {
      return msg.channel.send("wrong channel");
    }

    const question = "Please select a category to upload for points";
    const menu = new ButtonHandler(msg, question);

    menu.addButton(BLUE_BUTTON, "steps", async () => {

      const question = "Do you want to upload a single day or multiple days?";
      const menu = new ButtonHandler(msg, question);

      menu.addButton(BLUE_BUTTON, "single", async () => {

        const prompt = new Prompt(msg);
        const answer = await prompt.ask(
          "Please write the day of the month you want to upload steps for."
        );

        const date = DateTime.local(challenge.Year, challenge.Month-1);
        const maxDay = date.daysInMonth;
        const month = date.monthLong;
        const day = parseInt(answer);
        
        if (Number.isNaN(day) || day > maxDay) {
          msg.channel.send(
            oneLine`Please only write the day of the the month (use "5" for the
            5th day in the month).`
          );
          return;
        }

        const stepsRespond = await prompt.ask(
          oneLine`Please write how many steps you want to upload for
          ${month} ${day}.`
        );
        const steps = parseInt(stepsRespond);

        if (Number.isNaN(steps)) {
          msg.channel.send(`Please only write the number of steps without any text.`);
          return;
        } else if (steps > 250_000) {
          msg.channel.send("This challenge capped at 250k steps");
          return;
        }

        const respond = await prompt.collect(
          oneLine`Please upload a single screenshot of your wearable showing
          ${steps} steps on ${month} ${day}.`
        );

        const proof = respond.attachments.first();

        if (!proof) {
          msg.channel.send("No screenshot provided. Upload process failed.");
          return;
        }

        const challengeName: ChallengeName = "steps";
        const lookupID = `${challengeName}-${challengeID}`;
        const conversionRate = convertTable.get(lookupID);

        if (!conversionRate)
          throw new Error(`conversion rate does not exists for "${lookupID}"`);

        const showSuccessMessage = () => {
          const points = Math.round(conversionRate * steps);
          const xp = getXp(points);

          msg.channel.send(
            oneLine`You have registered ${steps} steps on ${month} ${day} and
            earned ${points} monthly points + ${xp} permanent XP! For a total
            overview of your uploads this month, use \`${client.prefix}progress\``
          );
        }

        try {

          await registerDayEntry(msg.author.id, day, challengeID, challengeName, steps);
          showSuccessMessage();

        } catch (e: unknown) {

          const question = oneLine`You already registered steps on ${month}
          ${day}. Do you want to replace or add point on this day?`;

          const menu = new ButtonHandler(msg, question);

          menu.addButton(BLUE_BUTTON, "replace", () => {
            replaceDayEntry(msg.author.id, day, challengeID, challengeName, steps);
            msg.channel.send(`Successfully replaced`);
            showSuccessMessage();
          });

          menu.addButton(RED_BUTTON, "add points", () => {
            addDayEntry(msg.author.id, day, challengeID, challengeName, steps);
            msg.channel.send(`Successfully added`);
            showSuccessMessage();
          });

          menu.addCloseButton();
          await menu.run();
        }


      })

      menu.addCloseButton();
      await menu.run();
    })

    menu.addCloseButton();
    await menu.run();
  }
}
