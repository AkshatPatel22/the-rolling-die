const express = require('express');
const router = express.Router();
const GamesModel = require('../models/games.js');

// Display the home page with a quick summary of what's on the shelf
router.get("/", async function(req, res)
{
  req.TPL.pagetitle = "Home";
  req.TPL.stats = await GamesModel.getStats();
  req.TPL.available = (await GamesModel.getAvailableGames()).slice(0, 6);
  res.render("home", req.TPL);
});

module.exports = router;
