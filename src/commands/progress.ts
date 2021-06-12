import { Message, MessageAttachment } from "discord.js";
import createProfile from "./createProfile";
import Canvas from "canvas";
import { getTotalPoints } from "../db/getTotalPoints";
import { getLevel, getXp } from "./utils";

export async function profile(msg: Message, args: string[]) {

  const userId = args[0] || msg.author.id;
  const member = msg.guild?.members.cache.get(userId);

  if (!member) {
    return msg.channel.send("User does not exist");
  } 

  // const canvas = Canvas.createCanvas(700, 250);
  // const context = canvas.getContext("2d");

  // const background = await Canvas.loadImage("https://cdn.discordapp.com/attachments/576986467084140557/852846797041696798/iu.png");
  // context.drawImage(background, 0, 0, canvas.width, canvas.height);
  // const attach = new MessageAttachment(canvas.toBuffer(), "sample.png");

  // msg.channel.send(attach);
  
  const totalPoints = await getTotalPoints(userId);
  const xp = getXp(totalPoints);
  msg.channel.send(`Total point: ${totalPoints}`)
  msg.channel.send(`XP: ${getXp(totalPoints)}`)
  msg.channel.send(`Level: ${getLevel(xp)}`)
}

