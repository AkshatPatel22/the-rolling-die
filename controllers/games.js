const express = require('express');
const router = express.Router();
const GamesModel = require('../models/games.js');
const CategoriesModel = require('../models/categories.js');

// Adds the fields the views need to show availability badges
function addAvailability(game)
{
  game.isavailable = game.available_copies > 0;
  game.lowstock = game.available_copies == 1;
  return game;
}

// Public catalogue: anyone can search the games and check availability
router.get("/", async function(req, res)
{
  const search = (req.query.search || "").trim();
  const categoryId = parseInt(req.query.category) || null;

  const games = await GamesModel.searchGames(search, categoryId);
  const categories = await CategoriesModel.getAllCategories();
  categories.forEach(function(c) { c.selected = c.id == categoryId; });

  req.TPL.pagetitle = "Games";
  req.TPL.games = games.map(addAvailability);
  req.TPL.nogames = games.length == 0;
  req.TPL.categories = categories;
  req.TPL.search = search;
  res.render("games", req.TPL);
});

// Details for one game
router.get("/:id", async function(req, res, next)
{
  const game = await GamesModel.getGameById(req.params.id);
  if (!game) return next();

  req.TPL.pagetitle = game.title;
  req.TPL.game = addAvailability(game);
  res.render("gamedetail", req.TPL);
});

module.exports = router;
