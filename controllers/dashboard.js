const express = require('express');
const router = express.Router();
const ActivityModel = require('../models/activity.js');
const GamesModel = require('../models/games.js');

// Manager dashboard: bot activity so far. New activity arrives live through Socket.IO.
router.get("/", async function(req, res)
{
  const activity = await ActivityModel.getRecentActivity(25);
  const counts = await ActivityModel.getCommandCounts();

  req.TPL.pagetitle = "Manager Dashboard";
  req.TPL.activity = activity;
  req.TPL.noactivity = activity.length == 0;
  req.TPL.counts = counts;
  req.TPL.total = counts.reduce(function(sum, c) { return sum + c.uses; }, 0);
  req.TPL.stats = await GamesModel.getStats();
  res.render("dashboard", req.TPL);
});

module.exports = router;
