const { getDb } = require('./db.js');

async function getAllCategories()
{
  const db = await getDb();
  return db.all("SELECT id, name FROM Categories ORDER BY name");
}

async function getCategoryById(id)
{
  const db = await getDb();
  return db.get("SELECT id, name FROM Categories WHERE id=?", id);
}

module.exports = { getAllCategories, getCategoryById };
