import { Message, MessageEmbed } from "discord.js";
import { getChallengeByChannelID, getDayEntries } from "../db/monthlyChallenge";
import Command from "../internals/Command";
import { client } from "../main";
import groupBy from "lodash.groupby";
import { toList } from "../internals/utils";

export default class extends Command {
  name = "progress";
  aliases = ["pr"];

  async exec(msg: Message) {

    const channelID = client.isDev ? "859483633534238762" : msg.channel.id;
    const challenge = await getChallengeByChannelID(channelID);
    const challengeID = challenge.ID;
    const entries = await getDayEntries(msg.author.id, challengeID);

    const dayEntries = Object.entries(groupBy(entries, x => x.Day));
    const dayList = dayEntries
      .sort((b, a) => parseInt(b[0]) - parseInt(a[0]))
      .map(([day, dayEntry]) => `Day ${day} - ${dayEntry.map(x => `${x.Value} ${x.ValueType}`).join(" | ")}`)

    const embed = new MessageEmbed()
      .setTitle("Progress by day")
      .setDescription(toList(dayList));

    msg.channel.send(embed);
  }
}
