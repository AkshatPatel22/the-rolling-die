const { test, before, after } = require('node:test');
const assert = require('node:assert');
const initdb = require('./setup.js');
const request = require('supertest');
const { app } = require('../app.js');
const { closeDb } = require('../models/db.js');
const GamesModel = require('../models/games.js');

let staff;

before(async () => {
  await initdb();
  staff = request.agent(app);
  await staff.post("/login/attemptlogin").type("form").send({ username: "staff1", password: "staff123" });
});
after(closeDb);

const newGame = { title: "Carcassonne", category_id: 3, min_players: 2, max_players: 5, play_time: 40,
                  total_copies: 2, available_copies: 2, description: "Tiles and meeples" };

test("public catalogue lists, searches and filters games", async () => {
  const all = await request(app).get("/games");
  assert.strictEqual(all.status, 200);
  assert.strictEqual((all.text.match(/card-title/g) || []).length, 12);

  const search = await request(app).get("/games?search=ticket");
  assert.match(search.text, /Ticket to Ride/);
  assert.doesNotMatch(search.text, /Catan/);

  const coop = await request(app).get("/games?category=4");
  assert.match(coop.text, /Pandemic/);
  assert.doesNotMatch(coop.text, /Codenames/);

  const none = await request(app).get("/games?search=zzzz");
  assert.match(none.text, /No games match/);
});

test("game detail page shows availability, missing game is 404", async () => {
  const res = await request(app).get("/games/5");
  assert.match(res.text, /Wingspan/);
  assert.match(res.text, /All 1 in use/);
  assert.strictEqual((await request(app).get("/games/999")).status, 404);
});

test("logged-out users can't change the inventory", async () => {
  const res = await request(app).post("/inventory/delete/1");
  assert.strictEqual(res.headers.location, "/login");
  assert.ok(await GamesModel.getGameById(1));
});

test("invalid game form is rejected with error messages", async () => {
  const res = await staff.post("/inventory/create").type("form")
    .send({ title: "", category_id: 99, min_players: 3, max_players: 2, play_time: 0, total_copies: 1, available_copies: 5 });
  assert.strictEqual(res.status, 400);
  assert.match(res.text, /Title is required/);
  assert.match(res.text, /choose a category/);
  assert.match(res.text, /Maximum players/);
  assert.match(res.text, /Available copies must be/);
});

test("duplicate titles are rejected", async () => {
  const res = await staff.post("/inventory/create").type("form").send({ ...newGame, title: "catan" });
  assert.strictEqual(res.status, 400);
  assert.match(res.text, /already exists/);
});

test("staff can create, update, check out, return and delete a game", async () => {
  // create
  let res = await staff.post("/inventory/create").type("form").send(newGame);
  assert.strictEqual(res.headers.location, "/inventory");
  const game = await GamesModel.findGameByTitle("Carcassonne");
  assert.ok(game);
  assert.strictEqual(game.updated_by, "staff1");

  // update
  res = await staff.post("/inventory/update/" + game.id).type("form").send({ ...newGame, title: "Carcassonne Big Box", total_copies: 3, available_copies: 3 });
  assert.strictEqual(res.headers.location, "/inventory");
  assert.strictEqual((await GamesModel.getGameById(game.id)).title, "Carcassonne Big Box");

  // check out every copy, then one more should fail
  for (let i = 0; i < 3; i++) await staff.post("/inventory/checkout/" + game.id);
  assert.strictEqual((await GamesModel.getGameById(game.id)).available_copies, 0);
  await staff.post("/inventory/checkout/" + game.id);
  assert.match((await staff.get("/inventory")).text, /No copies left/);
  assert.strictEqual((await GamesModel.getGameById(game.id)).available_copies, 0);

  // return one
  await staff.post("/inventory/return/" + game.id);
  assert.strictEqual((await GamesModel.getGameById(game.id)).available_copies, 1);

  // delete
  await staff.post("/inventory/delete/" + game.id);
  assert.strictEqual(await GamesModel.getGameById(game.id), undefined);
});

test("user input is HTML-escaped in pages", async () => {
  await staff.post("/inventory/create").type("form").send({ ...newGame, title: "Escape Test", description: "<script>alert(1)</script>" });
  const game = await GamesModel.findGameByTitle("Escape Test");
  const res = await request(app).get("/games/" + game.id);
  assert.doesNotMatch(res.text, /<script>alert\(1\)<\/script>/);
  assert.match(res.text, /&lt;script&gt;/);
});
