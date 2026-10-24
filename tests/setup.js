// Points the app at a throwaway database and fills it with the seed data.
// Each test file runs in its own process, so each gets its own database.
const path = require('path');
const os = require('os');
const fs = require('fs');

process.env.DB_FILE = path.join(os.tmpdir(), "rollingdie-test-" + process.pid + ".db");
process.env.SESSION_SECRET = "test-secret";

// remove the test database when the tests finish
process.on("exit", () => fs.rmSync(process.env.DB_FILE, { force: true }));

const initdb = require('../initdb.js');

module.exports = initdb;
