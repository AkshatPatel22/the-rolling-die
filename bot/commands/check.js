const { SlashCommandBuilder } = require('discord.js');
const GamesModel = require('../../models/games.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('check')
    .setDescription('Check if a board game is available at The Rolling Die')
    .addStringOption(option =>
      option.setName('game')
        .setDescription('The name of the game')
        .setRequired(true)
        .setMaxLength(80)),

  async execute(interaction) {
    const title = interaction.options.getString('game').trim();
    const game = await GamesModel.findGameByTitle(title);
    let reply;

    if (!game)
    {
      reply = `Sorry, we don't have a game called "${title}" in our library.`;
    }
    else if (game.available_copies > 0)
    {
      reply = `Yes! **${game.title}** is available: ${game.available_copies} of ${game.total_copies} copies are on the shelf. ` +
              `(${game.min_players}-${game.max_players} players, about ${game.play_time} min)`;
    }
    else
    {
      const copies = game.total_copies == 1 ? "Our only copy" : `All ${game.total_copies} copies`;
      reply = `${copies} of **${game.title}** ${game.total_copies == 1 ? "is" : "are"} being played right now. Check back soon!`;
    }

    await interaction.reply(reply);
    return reply;
  },
};
