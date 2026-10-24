const { SlashCommandBuilder } = require('discord.js');
const GamesModel = require('../../models/games.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('players')
    .setDescription('Find games for the size of your group')
    .addIntegerOption(option =>
      option.setName('count')
        .setDescription('How many people are playing')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(20)),

  async execute(interaction) {
    const count = interaction.options.getInteger('count');
    const games = await GamesModel.getGamesForPlayers(count);
    let reply;

    if (games.length == 0)
    {
      reply = `Sorry, we don't have any games for ${count} players.`;
    }
    else
    {
      const lines = games.map(g => `- ${g.title}: ` + (g.available_copies > 0 ? `${g.available_copies} available` : "all in use"));
      reply = `Games for ${count} players:\n` + lines.join("\n");
    }

    await interaction.reply(reply.slice(0, 2000));
    return reply.slice(0, 2000);
  },
};
