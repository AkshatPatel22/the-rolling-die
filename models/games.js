const { getDb } = require('./db.js');

// Columns we select every time we read games, joined with their category name
const GAME_FIELDS = `SELECT Games.id, title, category_id, Categories.name AS category,
                       min_players, max_players, play_time, total_copies, available_copies,
                       description, updated_at, Users.username AS updated_by
                     FROM Games
                     JOIN Categories ON Games.category_id = Categories.id
                     LEFT JOIN Users ON Games.updated_by = Users.id`;

async function getAllGames()
{
  const db = await getDb();
  return db.all(GAME_FIELDS + " ORDER BY title");
}

// Search by title (partial match) and/or category id
async function searchGames(term, categoryId)
{
  const db = await getDb();
  let sql = GAME_FIELDS + " WHERE title LIKE ?";
  const params = ["%" + (term || "") + "%"];

  if (categoryId)
  {
    sql += " AND category_id = ?";
    params.push(categoryId);
  }
  return db.all(sql + " ORDER BY title", params);
}

async function getGameById(id)
{
  const db = await getDb();
  return db.get(GAME_FIELDS + " WHERE Games.id = ?", id);
}

// Exact title match first, otherwise the closest partial match
async function findGameByTitle(title)
{
  const db = await getDb();
  const exact = await db.get(GAME_FIELDS + " WHERE title = ?", title);
  if (exact) return exact;
  return db.get(GAME_FIELDS + " WHERE title LIKE ? ORDER BY length(title) LIMIT 1", "%" + title + "%");
}

async function getAvailableGames(categoryName)
{
  const db = await getDb();
  if (categoryName)
  {
    return db.all(GAME_FIELDS + " WHERE available_copies > 0 AND Categories.name = ? COLLATE NOCASE ORDER BY title", categoryName);
  }
  return db.all(GAME_FIELDS + " WHERE available_copies > 0 ORDER BY title");
}

// Games that support the given number of players
async function getGamesForPlayers(players)
{
  const db = await getDb();
  return db.all(GAME_FIELDS + " WHERE min_players <= ? AND max_players >= ? ORDER BY available_copies DESC, title", [players, players]);
}

async function getStats()
{
  const db = await getDb();
  return db.get(`SELECT COUNT(*) AS titles,
                        IFNULL(SUM(total_copies), 0) AS copies,
                        IFNULL(SUM(available_copies), 0) AS available,
                        IFNULL(SUM(available_copies = 0), 0) AS soldout
                 FROM Games`);
}

async function createGame(game, userId)
{
  const db = await getDb();
  const result = await db.run(`INSERT INTO Games (title, category_id, min_players, max_players, play_time,
                                 total_copies, available_copies, description, updated_by)
                               VALUES (?,?,?,?,?,?,?,?,?)`,
                              [game.title, game.category_id, game.min_players, game.max_players, game.play_time,
                               game.total_copies, game.available_copies, game.description, userId]);
  return result.lastID;
}

async function updateGame(id, game, userId)
{
  const db = await getDb();
  await db.run(`UPDATE Games SET title=?, category_id=?, min_players=?, max_players=?, play_time=?,
                  total_copies=?, available_copies=?, description=?, updated_by=?, updated_at=CURRENT_TIMESTAMP
                WHERE id=?`,
               [game.title, game.category_id, game.min_players, game.max_players, game.play_time,
                game.total_copies, game.available_copies, game.description, userId, id]);
}

// Change available copies by +1 (returned) or -1 (taken to a table), staying within 0..total
async function changeAvailability(id, amount, userId)
{
  const db = await getDb();
  const result = await db.run(`UPDATE Games SET available_copies = available_copies + ?, updated_by=?, updated_at=CURRENT_TIMESTAMP
                               WHERE id=? AND available_copies + ? BETWEEN 0 AND total_copies`,
                              [amount, userId, id, amount]);
  return result.changes == 1;
}

async function deleteGame(id)
{
  const db = await getDb();
  await db.run("DELETE FROM Games WHERE id=?", id);
}

module.exports = { getAllGames, searchGames, getGameById, findGameByTitle, getAvailableGames,
                   getGamesForPlayers, getStats, createGame, updateGame, changeAvailability, deleteGame };
