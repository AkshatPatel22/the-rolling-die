# Test Report

Tested on Node.js 22 (Linux) on 2026-10-24. Run the automated tests yourself with `npm test`.

## Automated tests: 23 passed, 0 failed

| File | Test | Result |
| --- | --- | --- |
| `auth.test.js` | Home page renders | PASS |
| | `/` redirects to `/home`, unknown pages give 404 | PASS |
| | Passwords are stored as bcrypt hashes | PASS |
| | `/inventory`, `/dashboard`, `/staff` redirect to login when logged out | PASS |
| | Wrong password and blank fields are rejected | PASS |
| | Staff log in, session persists, manager pages give 403 | PASS |
| | Logout ends the session | PASS |
| | Manager creates a staff account (with validation) that can log in | PASS |
| `inventory.test.js` | Catalogue lists, searches and filters by category | PASS |
| | Game detail shows availability; missing game is 404 | PASS |
| | Logged-out users can't change the inventory | PASS |
| | Invalid game form is rejected with error messages | PASS |
| | Duplicate titles are rejected | PASS |
| | Create, update, check out (stops at 0), return and delete a game | PASS |
| | User input is HTML-escaped | PASS |
| `realtime.test.js` | Public sockets receive `inventory-updated` when staff check out a copy | PASS |
| | Only manager sockets receive `bot-activity` | PASS |
| | Managers receive `bot-status` | PASS |
| `bot.test.js` | Every command file has a valid slash command definition | PASS |
| | `/check`: available, all in use, partial name, unknown game | PASS |
| | `/available`: all games and by category, unknown category | PASS |
| | `/players`: matching games, no matches | PASS |
| | Each command is saved to `BotActivity` | PASS |

The bot tests use a stand-in interaction object with the same `options` and `reply()` methods as discord.js, so the real command code and database queries run, but nothing is sent to Discord.

## Manual and browser checks

| Check | Result |
| --- | --- |
| Fresh `git clone`, `npm ci`, copy `.env.example`, `npm run initdb`, `npm start` | PASS: all pages respond |
| No `.env` or `.db` file is tracked by Git | PASS |
| Server starts without a Discord token (prints a message, website works) | PASS |
| Server keeps running if the Discord login fails | PASS |
| Chromium: staff click "− Out" and the customer's games page badge updates without a reload | PASS |
| Chromium: dashboard shows new bot activity rows, total and per-command counts live | PASS |
| Chromium: a Discord message containing HTML shows as text, not as an element | PASS |
| Chromium: dashboard activity is still there after a reload (read from the database) | PASS |
| Chromium: no JavaScript errors on any page | PASS |
| Bootstrap layout at 1280px and 390px (phone) widths, no horizontal scrolling on phone | PASS |
| Browser blocks submitting the add game form with a blank title | PASS |

## Not tested yet

| Check | Why | How to test |
| --- | --- | --- |
| Bot logging in to Discord and answering real slash commands | This build environment can't reach discord.com and has no bot token | Follow "Setting up the Discord bot" in the README, then section 7 of DEMO-CHECKLIST.md |
| `npm run deploy-commands` registering commands with Discord | Same reason | Run it after filling in `.env`; it should print "Registered 4 commands" |
| Running on Windows / PowerShell | Built and tested on Linux | Follow the README install steps on your PC and run `npm test` |

## Known limitations

- Sessions use the default in-memory store from the course slides, so restarting the server logs everyone out.
- The "Copies on the shelf" number on the dashboard updates on refresh, not live. The live inventory feed beside it does update live.
- Categories are fixed by the seed script; there is no page for adding categories.
