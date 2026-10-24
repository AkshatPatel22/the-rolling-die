const { test, before, after } = require('node:test');
const assert = require('node:assert');
const initdb = require('./setup.js');
const { handleCommand } = require('../bot/bot.js');
const loadCommands = require('../bot/loadcommands.js');
const ActivityModel = require('../models/activity.js');
const { closeDb } = require('../models/db.js');

before(initdb);
after(closeDb);

// A stand-in for a discord.js interaction with just the parts our commands use
function fakeInteraction(commandName, options)
{
  return {
    commandName,
    user: { tag: "tester" },
    replied: false,
    deferred: false,
    replies: [],
    options: {
      data: Object.entries(options).map(([name, value]) => ({ name, value })),
      getString: name => options[name] ?? null,
      getInteger: name => options[name] ?? null
    },
    async reply(text) { this.replied = true; this.replies.push(text); }
  };
}

async function run(commandName, options)
{
  const interaction = fakeInteraction(commandName, options || {});
  await handleCommand(interaction);
  return interaction.replies[0];
}

test("every command file has a valid definition", () => {
  const commands = loadCommands();
  assert.deepStrictEqual([...commands.keys()].sort(), ["available", "check", "help", "players"]);
  for (const command of commands.values())
  {
    const json = command.data.toJSON();
    assert.ok(json.name && json.description);
    assert.strictEqual(typeof command.execute, "function");
  }
});

test("/check reports available, in-use and unknown games", async () => {
  assert.match(await run("check", { game: "catan" }), /Catan\*\* is available: 2 of 3/);
  assert.match(await run("check", { game: "Wingspan" }), /only copy of \*\*Wingspan\*\* is being played/);
  assert.match(await run("check", { game: "ticket" }), /Ticket to Ride/);
  assert.match(await run("check", { game: "Monopoly" }), /don't have a game called "Monopoly"/);
});

test("/available lists games on the shelf, optionally by category", async () => {
  const all = await run("available");
  assert.match(all, /Catan/);
  assert.doesNotMatch(all, /Wingspan|Splendor/);

  const party = await run("available", { category: "party" });
  assert.match(party, /Codenames/);
  assert.doesNotMatch(party, /Catan/);

  assert.match(await run("available", { category: "Racing" }), /No Racing games/);
});

test("/players finds games for a group size", async () => {
  const seven = await run("players", { count: 7 });
  assert.match(seven, /Codenames/);
  assert.doesNotMatch(seven, /Catan/);
  assert.match(await run("players", { count: 20 }), /don't have any games for 20/);
});

test("each command is saved to the bot activity log", async () => {
  await run("help");
  const latest = (await ActivityModel.getRecentActivity(1))[0];
  assert.strictEqual(latest.command, "help");
  assert.strictEqual(latest.discord_user, "tester");

  await run("check", { game: "Azul" });
  const check = (await ActivityModel.getRecentActivity(1))[0];
  assert.strictEqual(check.query, "game: Azul");
  assert.match(check.response, /Azul/);
});
