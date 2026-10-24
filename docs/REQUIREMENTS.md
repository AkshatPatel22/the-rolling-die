# Requirements Checklist

> The official assignment brief and rubric were not available when this was written. Every row below comes from the project description ("The Rolling Die is a board game store and café... staff manage board game inventory, customers check availability, a Discord bot answers inventory questions, and a live manager dashboard displays bot activity") and the technologies listed for the course. **Check this list against the rubric** and add anything the rubric asks for that is missing.

| # | Requirement | Where it is implemented | How it is verified |
| --- | --- | --- | --- |
| 1 | Express web server | `app.js` | `auth.test.js`: home page renders, `/` redirects, 404 page |
| 2 | Mustache templates with shared partials | `views/` (`header`, `navigation`, `footer`, `flash`, `availability` partials) | Every page test renders through Mustache; browser screenshots |
| 3 | MVC structure (Router controllers, models per table, `req.TPL` template object) | `controllers/`, `models/`, `views/`, `app.js` | Code review; all route tests |
| 4 | SQLite database with related tables | `initdb.js`, `models/` (Games → Categories, Games.updated_by → Users) | `inventory.test.js` CRUD tests; foreign key rejects a bad category |
| 5 | Customers can check game availability | `/games`, `/games/:id`, `/home` | `inventory.test.js`: list, search, category filter, detail, 404 |
| 6 | Staff can manage the inventory (create, read, update, delete) | `controllers/inventory.js`, `/inventory` | `inventory.test.js`: full create, update, checkout, return, delete flow |
| 7 | Input validation | `readGameForm()` in `controllers/inventory.js`; `controllers/staff.js`; `controllers/login.js` | `inventory.test.js`: invalid form, duplicate title; `auth.test.js`: blank login, bad usernames and passwords |
| 8 | Staff login with sessions | `controllers/login.js`, `express-session` in `app.js` | `auth.test.js`: login, session persists, logout ends session |
| 9 | Passwords hashed with bcryptjs | `models/users.js`, `initdb.js` | `auth.test.js`: stored value is a bcrypt hash, wrong password rejected |
| 10 | Protected routes and access levels | `requireLogin`, `requireManager` in `app.js` | `auth.test.js`: logged-out users redirected, staff get 403 on manager pages |
| 11 | Discord bot answers inventory questions | `bot/bot.js`, `bot/commands/*.js` | `bot.test.js` runs every command against the seeded database |
| 12 | Discord slash commands (course layout: one file per command plus `deploy-commands.js`) | `bot/commands/`, `bot/deploy-commands.js` | `bot.test.js`: every command has a valid definition. **Live Discord test still to do on your PC** |
| 13 | Live manager dashboard showing bot activity | `/dashboard`, `socket.js`, `public/js/dashboard.js` | `realtime.test.js`; browser test showed new rows, counters and command counts update without a reload |
| 14 | Socket.IO real-time updates | `socket.js`, `public/js/live-availability.js` | `realtime.test.js`: public sockets get inventory updates, only managers get bot activity and status |
| 15 | Bot activity is stored | `BotActivity` table, `models/activity.js` | `bot.test.js`: each command is logged with user, query and reply; dashboard shows it after reload |
| 16 | Bootstrap 5 responsive interface, no custom CSS file | All views | Browser screenshots at 1280px and 390px; no horizontal scroll on mobile |
| 17 | Secrets in environment variables, `.env.example` provided, `.env` not committed | `.env.example`, `.gitignore`, `dotenv` in `app.js` and `bot/deploy-commands.js` | `git ls-files` shows no `.env` or `.db` file |
| 18 | README with installation and run steps | `README.md` | Steps followed in a clean folder (see TESTING.md) |
| 19 | Incremental Git history | `git log` | One commit per milestone |

## Extras that are not stated in the description

These were added because they make the core features usable. Remove them if the rubric doesn't want them.

- Manager page for creating and deleting staff accounts (`/staff`).
- Staff can mark a copy "out" to a table or "in" to the shelf with one click.
- Public game pages update their availability badges live.
- `/players` and `/help` bot commands.
