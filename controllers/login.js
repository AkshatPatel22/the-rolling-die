const express = require('express');
const router = express.Router();
const UsersModel = require('../models/users.js');

// Display the login page (logged-in users are sent straight to the home page)
router.get("/", function(req, res)
{
  if (req.session.username) return res.redirect("/inventory");

  req.TPL.pagetitle = "Staff Login";
  res.render("login", req.TPL);
});

// Check the username and password against the hashed password in the database
router.post("/attemptlogin", async function(req, res)
{
  const username = (req.body.username || "").trim();
  const password = req.body.password || "";

  if (username == "" || password == "")
  {
    req.session.flash_error = "Please enter both a username and a password.";
    return res.redirect("/login");
  }

  const user = await UsersModel.checkCredentials(username, password);

  if (!user)
  {
    req.session.flash_error = "Invalid username or password.";
    return res.redirect("/login");
  }

  // new session id on login so an old session cookie can't be reused
  req.session.regenerate(function() {
    req.session.userid = user.id;
    req.session.username = user.username;
    req.session.role = user.role;
    req.session.flash_success = "Welcome back, " + user.username + "!";
    res.redirect("/inventory");
  });
});

// Log the user out by destroying their session
router.get("/logout", function(req, res)
{
  req.session.destroy(function() {
    res.clearCookie("connect.sid");
    res.redirect("/home");
  });
});

module.exports = router;
