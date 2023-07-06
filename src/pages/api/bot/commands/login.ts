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
  inlineCode,
} from "@discordjs/builders";

export const execute = async (opt: CommandOptions) => {
  const { res: response } = opt;

  const callback = getBaseUrl() + "/api/lastfm_cb";

  const { member, guild_id } = opt.interaction;
  const discordId = member.user?.id!!;

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

  const session = await prisma.sessions.create({
    data: {
      discordId,
    },
  });

  const apiKey = process.env.LASTFM_API_KEY!!;

  const button = new ButtonBuilder()
    .setLabel("Teleport to last.fm!")
    .setStyle(ButtonStyle.Link)
    .setURL(
      `https://www.last.fm/api/auth?api_key=${apiKey}&cb=${callback}?sessionId=${session.id}`
    );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  response.json({
    message: `Use the link below to get started with Elixr c:\nIf you're stuck, try ${inlineCode(
      "/setup"
    )}!`,
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      components: [row.toJSON()],
      flags: MessageFlags.Ephemeral,
    },
  });
};
