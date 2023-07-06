import { CommandOptions } from "~/pages/api/bot/interfaces/Interaction";
import { InteractionResponseType, MessageFlags } from "discord-api-types/v10";
import { EmbedBuilder, inlineCode } from "@discordjs/builders";
import Colors from "~/constants/Colors";

export const execute = async (opt: CommandOptions) => {
  const { res: response } = opt;

  var helpGuide = `## Looking for help?

  Here are some step-by-step instructions on how to use this bot.
  
  ### Step one, create a last.fm account
  
  Elixr uses last.fm for tracking your streams, so head over to https://last.fm/ and create an account!
  
  ### Step two, link your Spotify
  
  In order for last.fm to track your Spotify streams, you have to link it. You can do so on [this](https://www.last.fm/settings/applications) page.
  **Note:** Only streams after you've linked your account are counted.
  
  ### Step three, login to Elixr!
  
  Once you've got last.fm all set up, you can log in to Elixr using last.fm by doing \`/login\`. Once you've logged in, you're free to close the tab.
  
  ### Final step, claim your rewards!
  
  You can run ${inlineCode(
    "/claim"
  )} to claim all your rewards set up for this server <3`;

  const embed = new EmbedBuilder()
    .setColor(Colors.green)
    .setDescription(helpGuide);

  response.json({
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      embeds: [embed.toJSON()],
      flags: MessageFlags.Ephemeral,
    },
  });
};
