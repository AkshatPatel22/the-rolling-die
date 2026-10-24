const sqlite3 = require("sqlite3").verbose();
const sqlite = require("sqlite");

let db;

// Open the database once and share the connection between all models
async function getDb()
{
  if (!db)
  {
    db = await sqlite.open({
      filename: process.env.DB_FILE || 'rollingdie.db',
      driver: sqlite3.Database
    });
    await db.run("PRAGMA foreign_keys = ON");
  }
  return db;
}

async function closeDb()
{
  if (db)
  {
    await db.close();
    db = undefined;
  }
}

module.exports = { getDb, closeDb };
