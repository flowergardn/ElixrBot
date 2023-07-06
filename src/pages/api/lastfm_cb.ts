import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "~/server/db";

// This is cringe since it doesn't support typescript
// I'm only using this library so I don't have to deal with authentication.
const LastFm = require("lastfm-node-client");

const fmAPI = new LastFm(
  process.env.LASTFM_API_KEY,
  process.env.LASTFM_API_SECRET
);

const lastfm = async (req: NextApiRequest, res: NextApiResponse) => {
  const { sessionId, token } = req.query;

  if (!sessionId || !token) {
    return res.status(400).json({
      success: false,
      error:
        "Unable to connect your account! Something got lost in translation between last.fm and Elixr. Please try connecting again <3",
    });
  }

  const sessionData = await prisma.sessions.findFirst({
    where: {
      id: sessionId.toString(),
    },
  });

  if (!sessionData) {
    return res.status(400).json({
      success: false,
      error:
        "Unable to connect your account! Something got lost in translation between last.fm and Elixr. Please try connecting again <3",
    });
  }

  let lastFMSession: {
    session: {
      name: string;
      key: string;
    };
  };

  try {
    lastFMSession = await fmAPI.authGetSession({ token });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error:
        "Unable to connect your account! Something happened on our end. Please try connecting again <3",
    });
  }

  await prisma.users.create({
    data: {
      discordId: sessionData.discordId,
      fmName: lastFMSession.session.name,
      fmToken: lastFMSession.session.key,
    },
  });

  res.redirect("/success?type=login");
};

export default lastfm;
