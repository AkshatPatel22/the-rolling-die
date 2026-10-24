const { getDb } = require('./db.js');

// Save one Discord bot interaction and return the saved row
async function logActivity(discordUser, command, query, response)
{
  const db = await getDb();
  const result = await db.run("INSERT INTO BotActivity (discord_user, command, query, response) VALUES (?,?,?,?)",
                              [discordUser, command, query, response]);
  return db.get("SELECT * FROM BotActivity WHERE id=?", result.lastID);
}

async function getRecentActivity(limit)
{
  const db = await getDb();
  return db.all("SELECT * FROM BotActivity ORDER BY id DESC LIMIT ?", limit || 25);
}

// Count of how many times each command has been used
async function getCommandCounts()
{
  const db = await getDb();
  return db.all("SELECT command, COUNT(*) AS uses FROM BotActivity GROUP BY command ORDER BY uses DESC");
}

module.exports = { logActivity, getRecentActivity, getCommandCounts };
