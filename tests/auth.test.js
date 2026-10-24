const { test, before, after } = require('node:test');
const assert = require('node:assert');
const initdb = require('./setup.js');
const request = require('supertest');
const { app } = require('../app.js');
const { closeDb } = require('../models/db.js');

before(initdb);
after(closeDb);

test("home page renders", async () => {
  const res = await request(app).get("/home");
  assert.strictEqual(res.status, 200);
  assert.match(res.text, /Welcome to The Rolling Die/);
});

test("/ redirects to /home and unknown pages are 404", async () => {
  assert.strictEqual((await request(app).get("/")).headers.location, "/home");
  assert.strictEqual((await request(app).get("/does-not-exist")).status, 404);
});

test("passwords are stored as bcrypt hashes", async () => {
  const { getDb } = require('../models/db.js');
  const db = await getDb();
  const user = await db.get("SELECT password FROM Users WHERE username='priya'");
  assert.notStrictEqual(user.password, "manager123");
  assert.match(user.password, /^\$2[aby]\$10\$/);
});

test("protected pages redirect to login when logged out", async () => {
  for (const page of ["/inventory", "/dashboard", "/staff"])
  {
    const res = await request(app).get(page);
    assert.strictEqual(res.status, 302, page);
    assert.strictEqual(res.headers.location, "/login");
  }
});

test("wrong password and blank fields are rejected", async () => {
  const agent = request.agent(app);
  let res = await agent.post("/login/attemptlogin").type("form").send({ username: "priya", password: "wrong" });
  assert.strictEqual(res.headers.location, "/login");
  assert.match((await agent.get("/login")).text, /Invalid username or password/);

  res = await agent.post("/login/attemptlogin").type("form").send({ username: "", password: "" });
  assert.match((await agent.get("/login")).text, /Please enter both/);
  assert.strictEqual((await agent.get("/inventory")).status, 302);
});

test("staff can log in, stay logged in, but can't open manager pages", async () => {
  const agent = request.agent(app);
  const res = await agent.post("/login/attemptlogin").type("form").send({ username: "staff1", password: "staff123" });
  assert.strictEqual(res.headers.location, "/inventory");

  // session persists across requests
  assert.strictEqual((await agent.get("/inventory")).status, 200);
  assert.match((await agent.get("/games")).text, /Signed in as/);

  assert.strictEqual((await agent.get("/dashboard")).status, 403);
  assert.strictEqual((await agent.get("/staff")).status, 403);
});

test("logout ends the session", async () => {
  const agent = request.agent(app);
  await agent.post("/login/attemptlogin").type("form").send({ username: "staff1", password: "staff123" });
  await agent.get("/login/logout");
  assert.strictEqual((await agent.get("/inventory")).status, 302);
});

test("manager can create a staff account that can then log in", async () => {
  const manager = request.agent(app);
  await manager.post("/login/attemptlogin").type("form").send({ username: "priya", password: "manager123" });
  assert.strictEqual((await manager.get("/staff")).status, 200);

  await manager.post("/staff/create").type("form").send({ username: "ab", password: "123456" });
  assert.match((await manager.get("/staff")).text, /Username must be/);

  await manager.post("/staff/create").type("form").send({ username: "newstaff", password: "short" });
  assert.match((await manager.get("/staff")).text, /at least 6 characters/);

  await manager.post("/staff/create").type("form").send({ username: "newstaff", password: "secret99", role: "staff" });
  assert.match((await manager.get("/staff")).text, /Account newstaff created/);

  await manager.post("/staff/create").type("form").send({ username: "newstaff", password: "secret99" });
  assert.match((await manager.get("/staff")).text, /already taken/);

  const newbie = request.agent(app);
  const res = await newbie.post("/login/attemptlogin").type("form").send({ username: "newstaff", password: "secret99" });
  assert.strictEqual(res.headers.location, "/inventory");
});
