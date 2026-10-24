const { test, before, after } = require('node:test');
const assert = require('node:assert');
const initdb = require('./setup.js');
const request = require('supertest');
const { io: connect } = require('socket.io-client');
const { server } = require('../app.js');
const socket = require('../socket.js');
const { closeDb } = require('../models/db.js');

let base;
const clients = [];

// Log in and return the session cookie so a socket can use it
async function loginCookie(username, password)
{
  const res = await request(base).post("/login/attemptlogin").type("form").send({ username, password });
  return res.headers["set-cookie"][0].split(";")[0];
}

function openSocket(cookie)
{
  const client = connect(base, { extraHeaders: cookie ? { cookie } : {}, transports: ["websocket"] });
  clients.push(client);
  return new Promise(resolve => client.on("connect", () => resolve(client)));
}

function waitFor(client, event)
{
  return new Promise(resolve => client.once(event, resolve));
}

before(async () => {
  await initdb();
  await new Promise(resolve => server.listen(0, resolve));
  base = "http://localhost:" + server.address().port;
});

after(async () => {
  clients.forEach(c => c.close());
  await new Promise(resolve => server.close(resolve));
  await closeDb();
});

test("everyone receives inventory updates when staff check out a copy", async () => {
  const publicClient = await openSocket();
  const staffCookie = await loginCookie("staff1", "staff123");

  const update = waitFor(publicClient, "inventory-updated");
  await request(base).post("/inventory/checkout/1").set("Cookie", staffCookie);
  const game = await update;

  assert.strictEqual(game.id, 1);
  assert.strictEqual(game.title, "Catan");
  assert.strictEqual(game.available_copies, 1);
});

test("only managers receive bot activity", async () => {
  const manager = await openSocket(await loginCookie("priya", "manager123"));
  const staff = await openSocket(await loginCookie("staff1", "staff123"));

  let staffGotIt = false;
  staff.on("bot-activity", () => { staffGotIt = true; });

  const received = waitFor(manager, "bot-activity");
  socket.botActivity({ id: 1, command: "check", discord_user: "tester", query: "game: Catan", response: "Yes" });
  const row = await received;

  assert.strictEqual(row.command, "check");
  await new Promise(resolve => setTimeout(resolve, 200));
  assert.strictEqual(staffGotIt, false);
});

test("managers are told the bot status when it changes", async () => {
  const manager = await openSocket(await loginCookie("priya", "manager123"));
  const status = waitFor(manager, "bot-status");
  socket.setBotStatus({ online: true, tag: "RollingDieBot#0001" });
  assert.deepStrictEqual(await status, { online: true, tag: "RollingDieBot#0001" });
});
