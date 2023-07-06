import { CommandOptions } from "~/pages/api/bot/interfaces/Interaction";
import {
  InteractionResponseType,
  MessageFlags,
  ButtonStyle,
} from "discord-api-types/v10";
import { getBaseUrl } from "~/utils/api";
import { prisma } from "~/server/db";
import {
  ButtonBuilder,
  ActionRowBuilder,
  EmbedBuilder,
} from "@discordjs/builders";
import Colors from "~/constants/Colors";

import { calculate } from "discord-permission";

export const execute = async (opt: CommandOptions) => {
  const { res: response } = opt;

  const { guild_id, member } = opt.interaction;

  const canManage = calculate("MANAGE_GUILD", parseInt(member.permissions));
  if (!canManage) return;

  const serverInfo = await prisma.servers.findFirst({
    where: {
      id: guild_id,
    },
  });

  if (!serverInfo) {
    await prisma.servers.create({
      data: {
        id: guild_id,
      },
    });
  }

  const sessionInfo = await prisma.rewardSession.create({
    data: {
      serverId: guild_id,
    },
  });

  const button = new ButtonBuilder()
    .setLabel("Create")
    .setStyle(ButtonStyle.Link)
    .setURL(getBaseUrl() + `/setup/${sessionInfo.id}`);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  const embed = new EmbedBuilder()
    .setColor(Colors.green)
    .setDescription(
      "## Create Reward\nIn order to maintain simplicity, you create rewards on our web panel! Click the button below to be directed to a unique editing session."
    );

  response.json({
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      components: [row.toJSON()],
      embeds: [embed.toJSON()],
      flags: MessageFlags.Ephemeral,
    },
  });
};
