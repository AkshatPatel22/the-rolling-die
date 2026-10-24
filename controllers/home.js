const express = require('express');
const router = express.Router();

// Display the home page
router.get("/", function(req, res)
{
  req.TPL.pagetitle = "Home";
  res.render("home", req.TPL);
});

module.exports = router;
