// Creates the database tables and fills them with starting data.
// Run with: npm run initdb   (this resets everything!)
require('dotenv').config({ quiet: true });

const bcrypt = require('bcryptjs');
const { getDb, closeDb } = require('./models/db.js');

const categories = ["Strategy", "Party", "Family", "Co-op", "Card Game", "Two Player"];

// title, category, min players, max players, minutes, total copies, available copies, description
const games = [
  ["Catan", "Strategy", 3, 4, 90, 3, 2, "Trade and build settlements on the island of Catan."],
  ["Ticket to Ride", "Family", 2, 5, 60, 2, 2, "Collect train cards and claim railway routes across North America."],
  ["Pandemic", "Co-op", 2, 4, 45, 2, 1, "Work together to stop four diseases from spreading around the world."],
  ["Codenames", "Party", 4, 8, 15, 3, 3, "Give one-word clues so your team can find its secret agents."],
  ["Wingspan", "Strategy", 1, 5, 70, 1, 0, "Attract birds to your wildlife preserves."],
  ["Azul", "Family", 2, 4, 45, 2, 2, "Draft colourful tiles to decorate the palace walls."],
  ["Exploding Kittens", "Card Game", 2, 5, 15, 2, 1, "Russian roulette with cards, and kittens."],
  ["Patchwork", "Two Player", 2, 2, 30, 1, 1, "Build the best quilt from oddly shaped patches."],
  ["Dixit", "Party", 3, 8, 30, 1, 1, "Tell stories with beautifully illustrated cards."],
  ["Forbidden Island", "Co-op", 2, 4, 30, 2, 2, "Recover the treasures before the island sinks."],
  ["Splendor", "Strategy", 2, 4, 30, 2, 0, "Collect gems and build a Renaissance jewellery empire."],
  ["Uno", "Card Game", 2, 10, 30, 4, 4, "Match colours and numbers, and don't forget to shout UNO."]
];

// Demo accounts for the professor demonstration (passwords are stored hashed)
const users = [
  ["priya", "manager123", "manager"],
  ["staff1", "staff123", "staff"]
];

async function initdb()
{
  const db = await getDb();

  await db.exec(`
    DROP TABLE IF EXISTS BotActivity;
    DROP TABLE IF EXISTS Games;
    DROP TABLE IF EXISTS Categories;
    DROP TABLE IF EXISTS Users;

    CREATE TABLE Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('staff', 'manager'))
    );

    CREATE TABLE Categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE Games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL UNIQUE COLLATE NOCASE,
      category_id INTEGER NOT NULL REFERENCES Categories(id),
      min_players INTEGER NOT NULL,
      max_players INTEGER NOT NULL,
      play_time INTEGER NOT NULL,
      total_copies INTEGER NOT NULL,
      available_copies INTEGER NOT NULL,
      description TEXT,
      updated_by INTEGER REFERENCES Users(id) ON DELETE SET NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE BotActivity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discord_user TEXT NOT NULL,
      command TEXT NOT NULL,
      query TEXT,
      response TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  for (const name of categories)
  {
    await db.run("INSERT INTO Categories (name) VALUES (?)", name);
  }

  for (const g of games)
  {
    const category = await db.get("SELECT id FROM Categories WHERE name=?", g[1]);
    await db.run(`INSERT INTO Games (title, category_id, min_players, max_players, play_time,
                  total_copies, available_copies, description) VALUES (?,?,?,?,?,?,?,?)`,
                 [g[0], category.id, g[2], g[3], g[4], g[5], g[6], g[7]]);
  }

  for (const u of users)
  {
    const hash = await bcrypt.hash(u[1], 10);
    await db.run("INSERT INTO Users (username, password, role) VALUES (?,?,?)", [u[0], hash, u[2]]);
  }
}

if (require.main === module)
{
  initdb().then(async function() {
    await closeDb();
    console.log("Database created and seeded.");
  });
}

module.exports = initdb;
