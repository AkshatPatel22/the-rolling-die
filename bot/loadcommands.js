// Reads every command file in /bot/commands (the layout from the discord.js guide)
const fs = require('fs');
const path = require('path');

function loadCommands()
{
  const commands = new Map();
  const folder = path.join(__dirname, 'commands');

  for (const file of fs.readdirSync(folder).filter(f => f.endsWith('.js')))
  {
    const command = require(path.join(folder, file));
    commands.set(command.data.name, command);
  }
  return commands;
}

module.exports = loadCommands;
