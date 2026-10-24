// The Discord bot runs inside the web server process so it can push
// activity to the manager dashboard through Socket.IO.
const { Client, Events, GatewayIntentBits } = require('discord.js');
const loadCommands = require('./loadcommands.js');
const ActivityModel = require('../models/activity.js');
const socket = require('../socket.js');

const commands = loadCommands();

// Turn the options the user typed into readable text, e.g. "game: Catan"
function describeOptions(interaction)
{
  return interaction.options.data.map(o => o.name + ": " + o.value).join(", ");
}

// Run a slash command, then save and broadcast what happened
async function handleCommand(interaction)
{
  const command = commands.get(interaction.commandName);
  if (!command) return;

  let reply;
  try
  {
    reply = await command.execute(interaction);
  }
  catch (error)
  {
    console.error(error);
    reply = "Sorry, something went wrong while answering that.";
    if (interaction.replied || interaction.deferred) await interaction.followUp(reply);
    else await interaction.reply(reply);
  }

  const row = await ActivityModel.logActivity(interaction.user.tag || interaction.user.username,
                                              interaction.commandName, describeOptions(interaction), reply);
  socket.botActivity(row);
}

function startBot(token)
{
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once(Events.ClientReady, function(readyClient) {
    console.log(`Discord bot logged in as ${readyClient.user.tag}`);
    socket.setBotStatus({ online: true, tag: readyClient.user.tag });
  });

  client.on(Events.InteractionCreate, async function(interaction) {
    if (interaction.isChatInputCommand()) await handleCommand(interaction);
  });

  client.on(Events.ShardDisconnect, function() {
    socket.setBotStatus({ online: false, tag: null });
  });

  client.login(token).catch(function(error) {
    console.error("Discord login failed: " + error.message);
    socket.setBotStatus({ online: false, tag: null });
  });

  return client;
}

module.exports = { startBot, handleCommand };
