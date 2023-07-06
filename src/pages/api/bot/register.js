require("dotenv").config({
  path: require("path").resolve(".env"),
});
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");

const commands = [
  {
    name: "login",
    description: "Login to Elixr to claim your rewards.",
  },
  {
    name: "claim",
    description: "Claim your streaming rewards",
  },
  {
    name: "setup",
    description: "Get help with Elixr",
  },
  {
    name: "create",
    description: "Create a streaming reward.",
  },
];

const token = process.env.DISCORD_BOT_TOKEN ?? "";
const id = process.env.DISCORD_CLIENT_ID ?? "";

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    console.log("[Discord API] Started refreshing application (/) commands.");
    await rest.put(Routes.applicationCommands(id), { body: commands });
    console.log(
      "[Discord API] Successfully reloaded application (/) commands."
    );
  } catch (error) {
    console.error(error);
  }
})();
