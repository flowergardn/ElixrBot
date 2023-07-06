import { CommandOptions } from "~/pages/api/bot/interfaces/Interaction";
import { InteractionResponseType, MessageFlags } from "discord-api-types/v10";
import { prisma } from "~/server/db";
import { EmbedBuilder, bold, inlineCode } from "@discordjs/builders";
import Colors from "~/constants/Colors";
import { Rewards, Users } from "@prisma/client";
import axios from "axios";

const LastFm = require("lastfm-node-client");

export const execute = async (opt: CommandOptions) => {
  const { res: response } = opt;

  let finalClaimMsg = "";

  // ew an any
  async function checkStreams(opt: {
    rewardInfo: Rewards;
    userInfo: Users;
    fmAPI: any;
    entityType: "artist" | "album";
  }) {
    const { rewardInfo, userInfo, fmAPI, entityType } = opt;

    const getInfoOptions: {
      artist?: string;
      username: string;
      album?: string;
    } = {
      artist: rewardInfo.artist,
      username: userInfo.fmName,
    };

    if (entityType === "album") {
      getInfoOptions.album = rewardInfo.name;
    }

    let streams = "";

    switch (entityType) {
      case "album": {
        const info = await fmAPI.albumGetInfo(getInfoOptions);
        streams = info.album.userplaycount;
        break;
      }
      case "artist": {
        const info = await fmAPI.artistGetInfo(getInfoOptions);
        streams = info.artist.stats.userplaycount;
        break;
      }
    }

    console.log(`${parseInt(streams)} on ${rewardInfo.name}`);

    if (parseInt(streams) < rewardInfo.amount) return;

    let reason = `Received a reward for reaching ${rewardInfo.amount} streams `;
    if (entityType === "artist") {
      reason + `on ${rewardInfo.name}.`;
    } else {
      reason += `on the ${rewardInfo.name} album.`;
    }

    const axiosConfig = {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        "X-Audit-Log-Reason": reason,
      },
    };

    const roleEndpoint = `https://discord.com/api/guilds/${rewardInfo.serverId}/members/${userInfo.discordId}/roles/${rewardInfo.roleId}`;

    await axios.put(roleEndpoint, undefined, axiosConfig);

    const claimedRewards = JSON.parse(userInfo.claimedRewards);
    claimedRewards.push(rewardInfo.id);

    await prisma.users.update({
      where: {
        discordId: userInfo.discordId,
      },
      data: {
        claimedRewards: JSON.stringify(claimedRewards),
      },
    });

    let words = rewardInfo.name;
    if (entityType === "album")
      words = `the ${rewardInfo.name} album by ${rewardInfo.artist}`;

    finalClaimMsg += `- Reached **${rewardInfo.amount}** streams on ${words}.\n`;
  }

  async function checkArtist(opt: {
    rewardInfo: Rewards;
    userInfo: Users;
    fmAPI: any;
  }) {
    await checkStreams({ ...opt, entityType: "artist" });
  }

  async function checkAlbum(opt: {
    rewardInfo: Rewards;
    userInfo: Users;
    fmAPI: any;
  }) {
    await checkStreams({ ...opt, entityType: "album" });
  }

  const { member, guild_id } = opt.interaction;
  const discordId = member.user?.id!!;

  const user = await prisma.users.findFirst({
    where: {
      discordId,
    },
  });

  if (!user) {
    const errorEmbed = new EmbedBuilder().setColor(Colors.red);
    errorEmbed.setDescription(
      `## You're not logged in!\nLogin using the ${inlineCode(
        "/login"
      )} command, then try again. If you're stuck, do ${inlineCode("/setup")}!`
    );
    response.json({
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        embeds: [errorEmbed.toJSON()],
        flags: MessageFlags.Ephemeral,
      },
    });
    return;
  }

  let rewards = await prisma.rewards.findMany({
    where: {
      serverId: guild_id,
    },
  });

  // Only get the rewards they have yet to claim
  rewards = rewards.filter((r) => !user.claimedRewards.includes(r.id));

  if (rewards.length === 0) {
    const errorEmbed = new EmbedBuilder().setColor(Colors.red);
    errorEmbed.setDescription(
      `## No rewards for you to claim!\nSeems like you've claimed them all, or none exists.`
    );
    response.json({
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        embeds: [errorEmbed.toJSON()],
        flags: MessageFlags.Ephemeral,
      },
    });
    return;
  }

  const fmAPI = new LastFm(
    process.env.LASTFM_API_KEY,
    process.env.LASTFM_API_SECRET,
    user.fmToken
  );

  await Promise.all(
    rewards.map(async (r) => {
      switch (r.type) {
        case "artist": {
          await checkArtist({
            fmAPI,
            rewardInfo: r,
            userInfo: user,
          });
          break;
        }
        case "album": {
          await checkAlbum({
            fmAPI,
            rewardInfo: r,
            userInfo: user,
          });
          break;
        }
      }
    })
  );

  if (finalClaimMsg.length == 0) {
    const errorEmbed = new EmbedBuilder().setColor(Colors.red);
    errorEmbed.setDescription(
      `## No rewards for you to claim!\nYou don't seem to be eligable for any, try again later!`
    );
    response.json({
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        embeds: [errorEmbed.toJSON()],
        flags: MessageFlags.Ephemeral,
      },
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(Colors.green)
    .setDescription(`## :tada: Rewards claimed!\n${finalClaimMsg}`);

  response.json({
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      embeds: [embed.toJSON()],
    },
  });
};
