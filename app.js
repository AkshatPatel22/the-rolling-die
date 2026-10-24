require('dotenv').config({ quiet: true });

const express = require('express');
const http = require('http');
const mustacheExpress = require('mustache-express');

const app = express();
const server = http.createServer(app);

// Mustache is our template engine, views live in /views
app.engine("mustache", mustacheExpress());
app.set('view engine', 'mustache');
app.set('views', __dirname + '/views');

// Parse form data from POST requests and serve files in /public
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));

// Start a fresh template object on every request
app.use(function(req, res, next) {
  req.TPL = {};
  req.TPL.year = new Date().getFullYear();
  next();
});

// Navigation highlighting
app.use("/home", function(req, res, next) { req.TPL.homenav = true; next(); });

// Controllers
app.use("/home", require("./controllers/home"));

app.get("/", function(req, res) {
  res.redirect("/home");
});

// Anything else is a 404
app.use(function(req, res) {
  req.TPL.pagetitle = "Page not found";
  res.status(404).render("notfound", req.TPL);
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  server.listen(PORT, function() {
    console.log("The Rolling Die is running at http://localhost:" + PORT);
  });
}

module.exports = { app, server };
