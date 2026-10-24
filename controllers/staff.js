const express = require('express');
const router = express.Router();
const UsersModel = require('../models/users.js');

// Manager page listing staff accounts
router.get("/", async function(req, res)
{
  req.TPL.pagetitle = "Staff Accounts";
  req.TPL.users = await UsersModel.getAllUsers();
  req.TPL.users.forEach(function(u) {
    u.ismanagerrole = u.role == "manager";
    u.isself = u.username == req.session.username;
  });
  res.render("staff", req.TPL);
});

// Create a new staff or manager account
router.post("/create", async function(req, res)
{
  const username = (req.body.username || "").trim();
  const password = req.body.password || "";
  const role = req.body.role == "manager" ? "manager" : "staff";

  if (!/^[A-Za-z0-9_]{3,20}$/.test(username))
  {
    req.session.flash_error = "Username must be 3-20 letters, numbers or underscores.";
    return res.redirect("/staff");
  }
  if (password.length < 6)
  {
    req.session.flash_error = "Password must be at least 6 characters.";
    return res.redirect("/staff");
  }
  if (await UsersModel.getUserByUsername(username))
  {
    req.session.flash_error = "That username is already taken.";
    return res.redirect("/staff");
  }

  await UsersModel.createUser(username, password, role);
  req.session.flash_success = "Account " + username + " created.";
  res.redirect("/staff");
});

// Delete an account (managers can't delete themselves)
router.post("/delete/:id", async function(req, res)
{
  if (req.params.id == req.session.userid)
  {
    req.session.flash_error = "You can't delete your own account.";
  }
  else
  {
    await UsersModel.deleteUser(req.params.id);
    req.session.flash_success = "Account deleted.";
  }
  res.redirect("/staff");
});

module.exports = router;
