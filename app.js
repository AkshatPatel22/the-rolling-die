require('dotenv').config({ quiet: true });

const express = require('express');
const http = require('http');
const mustacheExpress = require('mustache-express');
const session = require('express-session');

const app = express();
const server = http.createServer(app);

// Mustache is our template engine, views live in /views
app.engine("mustache", mustacheExpress());
app.set('view engine', 'mustache');
app.set('views', __dirname + '/views');

// Parse form data from POST requests and serve files in /public
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));

// Sessions keep staff logged in between page loads
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-only-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 4 }
}));

// Start a fresh template object on every request, with login details for the navbar
app.use(function(req, res, next) {
  req.TPL = {};
  req.TPL.year = new Date().getFullYear();
  req.TPL.loggedin = !!req.session.username;
  req.TPL.username = req.session.username;
  req.TPL.ismanager = req.session.role == "manager";

  // one-time messages saved before a redirect
  req.TPL.flash_success = req.session.flash_success;
  req.TPL.flash_error = req.session.flash_error;
  delete req.session.flash_success;
  delete req.session.flash_error;
  next();
});

// Only logged-in staff (or managers) may continue
function requireLogin(req, res, next)
{
  if (req.session.username) next();
  else res.redirect("/login");
}

// Only managers may continue
function requireManager(req, res, next)
{
  if (req.session.username && req.session.role == "manager") next();
  else if (req.session.username) res.status(403).render("forbidden", req.TPL);
  else res.redirect("/login");
}

// Navigation highlighting
app.use("/home", function(req, res, next) { req.TPL.homenav = true; next(); });
app.use("/games", function(req, res, next) { req.TPL.gamesnav = true; next(); });
app.use("/inventory", function(req, res, next) { req.TPL.inventorynav = true; next(); });
app.use("/login", function(req, res, next) { req.TPL.loginnav = true; next(); });
app.use("/staff", function(req, res, next) { req.TPL.staffnav = true; next(); });

// Controllers
app.use("/home", require("./controllers/home"));
app.use("/games", require("./controllers/games"));
app.use("/inventory", requireLogin, require("./controllers/inventory"));
app.use("/login", require("./controllers/login"));
app.use("/staff", requireManager, require("./controllers/staff"));

app.get("/", function(req, res) {
  res.redirect("/home");
});

// Anything else is a 404
app.use(function(req, res) {
  req.TPL.pagetitle = "Page not found";
  res.status(404).render("notfound", req.TPL);
});

// Unexpected errors show a friendly page instead of a stack trace
app.use(function(err, req, res, next) {
  console.error(err);
  res.status(500).render("error", req.TPL || {});
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  server.listen(PORT, function() {
    console.log("The Rolling Die is running at http://localhost:" + PORT);
  });
}

module.exports = { app, server };
