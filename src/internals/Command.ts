import { Command as CommandBase } from "@jiman24/commandment";

export default abstract class Command extends CommandBase {
  block = true;
}
