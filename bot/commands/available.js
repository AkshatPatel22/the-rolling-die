const { SlashCommandBuilder } = require('discord.js');
const GamesModel = require('../../models/games.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('available')
    .setDescription('List the games that are on the shelf right now')
    .addStringOption(option =>
      option.setName('category')
        .setDescription('Only show one category, e.g. Party or Co-op')
        .setRequired(false)
        .setMaxLength(40)),

  async execute(interaction) {
    const category = interaction.options.getString('category');
    const games = await GamesModel.getAvailableGames(category ? category.trim() : null);
    let reply;

    if (games.length == 0)
    {
      reply = category ? `No ${category} games are available right now.` : "Every game is being played right now!";
    }
    else
    {
      const lines = games.map(g => `- ${g.title} (${g.available_copies} of ${g.total_copies})`);
      reply = (category ? `Available ${category} games:\n` : "Games on the shelf right now:\n") + lines.join("\n");
    }

    await interaction.reply(reply.slice(0, 2000));
    return reply.slice(0, 2000);
  },
};
