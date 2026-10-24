// Registers the slash commands with our Discord server.
// Run with: npm run deploy-commands   (again whenever a command definition changes)
require('dotenv').config({ quiet: true });

const { REST, Routes } = require('discord.js');
const loadCommands = require('./loadcommands.js');

const { DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID || !DISCORD_GUILD_ID)
{
  console.error("Set DISCORD_TOKEN, DISCORD_CLIENT_ID and DISCORD_GUILD_ID in your .env file first.");
  process.exit(1);
}

const commands = [...loadCommands().values()].map(command => command.data.toJSON());
const rest = new REST().setToken(DISCORD_TOKEN);

(async () => {
  try
  {
    console.log(`Registering ${commands.length} slash commands...`);
    const data = await rest.put(Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID), { body: commands });
    console.log(`Registered ${data.length} commands: ` + data.map(c => "/" + c.name).join(", "));
  }
  catch (error)
  {
    console.error(error);
    process.exit(1);
  }
})();
