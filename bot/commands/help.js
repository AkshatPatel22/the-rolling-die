const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show what The Rolling Die bot can do'),

  async execute(interaction) {
    const reply = "Here's what I can do:\n" +
                  "`/check game:<name>`: is a game available right now?\n" +
                  "`/available [category]`: list games on the shelf\n" +
                  "`/players count:<number>`: games for your group size";
    await interaction.reply(reply);
    return reply;
  },
};
