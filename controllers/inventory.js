const express = require('express');
const router = express.Router();
const GamesModel = require('../models/games.js');
const CategoriesModel = require('../models/categories.js');

// Read and validate the add/edit game form. Returns { game, errors }.
async function readGameForm(body)
{
  const game = {
    title: (body.title || "").trim(),
    category_id: parseInt(body.category_id),
    min_players: parseInt(body.min_players),
    max_players: parseInt(body.max_players),
    play_time: parseInt(body.play_time),
    total_copies: parseInt(body.total_copies),
    available_copies: parseInt(body.available_copies),
    description: (body.description || "").trim()
  };
  const errors = [];

  if (game.title == "" || game.title.length > 80) errors.push("Title is required (80 characters max).");
  if (!(await CategoriesModel.getCategoryById(game.category_id))) errors.push("Please choose a category.");
  if (!(game.min_players >= 1)) errors.push("Minimum players must be at least 1.");
  if (!(game.max_players >= game.min_players)) errors.push("Maximum players must be at least the minimum.");
  if (!(game.play_time >= 1)) errors.push("Play time must be at least 1 minute.");
  if (!(game.total_copies >= 0)) errors.push("Total copies can't be negative.");
  if (!(game.available_copies >= 0 && game.available_copies <= game.total_copies))
    errors.push("Available copies must be between 0 and the total copies.");
  if (game.description.length > 500) errors.push("Description must be 500 characters or less.");

  return { game, errors };
}

// Fill in the template object for the add/edit form
async function showForm(req, res, game, errors)
{
  const categories = await CategoriesModel.getAllCategories();
  categories.forEach(function(c) { c.selected = c.id == game.category_id; });

  req.TPL.game = game;
  req.TPL.categories = categories;
  req.TPL.errors = errors;
  req.TPL.haserrors = errors.length > 0;
  res.render("gameform", req.TPL);
}

// Staff inventory table
router.get("/", async function(req, res)
{
  const games = await GamesModel.getAllGames();
  games.forEach(function(g) {
    g.soldout = g.available_copies == 0;
    g.allin = g.available_copies == g.total_copies;
  });

  req.TPL.pagetitle = "Inventory";
  req.TPL.games = games;
  req.TPL.stats = await GamesModel.getStats();
  res.render("inventory", req.TPL);
});

router.get("/add", async function(req, res)
{
  req.TPL.pagetitle = "Add Game";
  req.TPL.formaction = "/inventory/create";
  await showForm(req, res, { min_players: 2, max_players: 4, play_time: 30, total_copies: 1, available_copies: 1 }, []);
});

router.post("/create", async function(req, res)
{
  const { game, errors } = await readGameForm(req.body);

  if (errors.length == 0)
  {
    try
    {
      await GamesModel.createGame(game, req.session.userid);
      req.session.flash_success = game.title + " was added to the inventory.";
      return res.redirect("/inventory");
    }
    catch (err)
    {
      if (err.code != "SQLITE_CONSTRAINT") throw err;
      errors.push("A game called " + game.title + " already exists.");
    }
  }

  req.TPL.pagetitle = "Add Game";
  req.TPL.formaction = "/inventory/create";
  await showForm(req, res.status(400), game, errors);
});

router.get("/edit/:id", async function(req, res, next)
{
  const game = await GamesModel.getGameById(req.params.id);
  if (!game) return next();

  req.TPL.pagetitle = "Edit " + game.title;
  req.TPL.editing = true;
  req.TPL.formaction = "/inventory/update/" + game.id;
  await showForm(req, res, game, []);
});

router.post("/update/:id", async function(req, res, next)
{
  const existing = await GamesModel.getGameById(req.params.id);
  if (!existing) return next();

  const { game, errors } = await readGameForm(req.body);
  game.id = existing.id;

  if (errors.length == 0)
  {
    try
    {
      await GamesModel.updateGame(existing.id, game, req.session.userid);
      req.session.flash_success = game.title + " was updated.";
      return res.redirect("/inventory");
    }
    catch (err)
    {
      if (err.code != "SQLITE_CONSTRAINT") throw err;
      errors.push("A game called " + game.title + " already exists.");
    }
  }

  req.TPL.pagetitle = "Edit " + existing.title;
  req.TPL.editing = true;
  req.TPL.formaction = "/inventory/update/" + existing.id;
  await showForm(req, res.status(400), game, errors);
});

// A copy goes out to a table (-1) or comes back to the shelf (+1)
router.post("/checkout/:id", async function(req, res)
{
  const ok = await GamesModel.changeAvailability(req.params.id, -1, req.session.userid);
  if (!ok) req.session.flash_error = "No copies left to hand out.";
  res.redirect("/inventory");
});

router.post("/return/:id", async function(req, res)
{
  const ok = await GamesModel.changeAvailability(req.params.id, 1, req.session.userid);
  if (!ok) req.session.flash_error = "All copies are already on the shelf.";
  res.redirect("/inventory");
});

router.post("/delete/:id", async function(req, res)
{
  const game = await GamesModel.getGameById(req.params.id);
  if (game)
  {
    await GamesModel.deleteGame(game.id);
    req.session.flash_success = game.title + " was removed from the inventory.";
  }
  res.redirect("/inventory");
});

module.exports = router;
