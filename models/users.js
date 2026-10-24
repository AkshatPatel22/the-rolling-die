const bcrypt = require('bcryptjs');
const { getDb } = require('./db.js');

// Returns the user if the username exists and the password matches the stored hash
async function checkCredentials(username, password)
{
  const db = await getDb();
  const user = await db.get("SELECT * FROM Users WHERE username=?", username);
  if (user && await bcrypt.compare(password, user.password)) return user;
  return undefined;
}

async function getUserByUsername(username)
{
  const db = await getDb();
  return db.get("SELECT id, username, role FROM Users WHERE username=?", username);
}

async function getAllUsers()
{
  const db = await getDb();
  return db.all("SELECT id, username, role FROM Users ORDER BY role, username");
}

async function createUser(username, password, role)
{
  const db = await getDb();
  const hash = await bcrypt.hash(password, 10);
  await db.run("INSERT INTO Users (username, password, role) VALUES (?,?,?)", [username, hash, role]);
}

async function deleteUser(id)
{
  const db = await getDb();
  await db.run("DELETE FROM Users WHERE id=?", id);
}

module.exports = { checkCredentials, getUserByUsername, getAllUsers, createUser, deleteUser };
