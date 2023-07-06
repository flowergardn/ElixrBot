import type { NextApiRequest, NextApiResponse } from "next";

import type {
  APIChatInputApplicationCommandInteractionData,
  APIGuildMember,
} from "discord-api-types/v10";

export interface Interaction {
  data: APIChatInputApplicationCommandInteractionData;
  member: {
    user: {
      id: string;
      username: string;
      avatar: string;
    };
    roles: string[];
    permissions: string;
    pending: boolean;
    nick: boolean;
    mute: boolean;
    joined_at: string;
    is_pending: boolean;
    deaf: boolean;
  };
  guild_id: string;
}

export interface CommandOptions {
  res: NextApiResponse;
  req: NextApiRequest;
  interaction: Interaction;
}
