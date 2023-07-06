import { TRPCError } from "@trpc/server";
import axios from "axios";
import { RESTGetAPIGuildRolesResult } from "discord-api-types/v10";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { prisma } from "~/server/db";

export const generalRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),
  getSession: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const s = await prisma.rewardSession.findFirst({
        where: {
          id: input.id,
        },
      });

      if (!s) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }

      const serverRoles: {
        data: RESTGetAPIGuildRolesResult;
      } = await axios.get(
        `https://discord.com/api/guilds/${s.serverId}/roles`,
        {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          },
        }
      );

      const roles = serverRoles.data.filter((r) => !r.managed);

      return {
        roles,
      };
    }),
  createReward: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
        type: z.string(),
        artist: z.string(),
        role: z.string(),
        amount: z.string(),
        name: z.string().nullish(),
      })
    )
    .mutation(async ({ input }) => {
      const s = await prisma.rewardSession.findFirst({
        where: {
          id: input.sessionId,
        },
      });

      if (!s) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }

      const { type, artist, role: roleId, amount, name } = input;

      await prisma.rewards.create({
        data: {
          type: type.toLowerCase(),
          artist,
          roleId,
          amount: parseInt(amount),
          name: name ?? artist,
          serverId: s.serverId,
        },
      });

      await prisma.rewardSession.delete({
        where: {
          id: input.sessionId,
        },
      });
    }),
});
