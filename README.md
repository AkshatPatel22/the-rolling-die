# The Rolling Die

A website, Discord bot and live manager dashboard for **The Rolling Die**, a board game store and café owned by Priya.

- **Customers** browse the game library and see how many copies of each game are on the shelf right now.
- **Staff** log in to add, edit and delete games and to mark copies as taken to a table or returned.
- **Discord users** ask the bot about availability with slash commands.
- **Managers** watch a live dashboard showing every question the bot answers, plus inventory changes as they happen.

Author: Akshat Patel (000912500)

## Technologies

| Area | Used |
| --- | --- |
| Server | Node.js, Express |
| Views | Mustache (`mustache-express`) with partials, Bootstrap 5 (CDN) |
| Architecture | MVC: `models/`, `views/`, `controllers/` |
| Database | SQLite (`sqlite3` + `sqlite`) |
| Login | `express-session`, `bcryptjs` password hashing |
| Real time | Socket.IO |
| Discord | discord.js slash commands |
| Config | dotenv (`.env`) |
| Tests | Node's built-in test runner, supertest, socket.io-client |

## Installation (Windows, PowerShell)

You need **Node.js 20 or newer** and **Git**.

```powershell
git clone <your-repo-url> the-rolling-die
cd the-rolling-die
npm install
Copy-Item .env.example .env
npm run initdb
npm start
```

Open <http://localhost:3000>.

`npm run initdb` creates `rollingdie.db` with 6 categories, 12 games and two demo accounts. Running it again resets the database.

| Username | Password | Role |
| --- | --- | --- |
| `priya` | `manager123` | manager (inventory, dashboard, staff accounts) |
| `staff1` | `staff123` | staff (inventory only) |

These are demo passwords for marking. They are stored as bcrypt hashes, never as plain text.

## Setting up the Discord bot

The website works without Discord. If `DISCORD_TOKEN` is empty, the server just prints that the bot is not running.

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and create an application.
2. **Bot** tab: click *Reset Token* and copy the token.
3. **OAuth2 > URL Generator**: tick `bot` and `applications.commands`, then open the generated URL to invite the bot to your server.
4. Fill in `.env`:
   - `DISCORD_TOKEN`: the bot token
   - `DISCORD_CLIENT_ID`: *General Information > Application ID*
   - `DISCORD_GUILD_ID`: the first number after `/channels/` in your server's URL
5. Register the slash commands (only needed once, or after changing a command):

   ```powershell
   npm run deploy-commands
   ```

6. Run `npm start`. The bot starts inside the web server so it can push its activity to the dashboard.

### Slash commands

| Command | What it does |
| --- | --- |
| `/check game:<name>` | Says whether a game is available and how many copies are on the shelf. Partial names work (`ticket` finds Ticket to Ride). |
| `/available [category]` | Lists every game on the shelf, optionally only one category (e.g. `Party`). |
| `/players count:<number>` | Lists games that support that many players and whether they're available. |
| `/help` | Lists the commands. |

Every command is saved in the `BotActivity` table and pushed to the manager dashboard straight away.

## Pages

| URL | Who | Purpose |
| --- | --- | --- |
| `/home` | everyone | Welcome page, shelf totals, games available now |
| `/games` | everyone | Search by title and filter by category, live availability badges |
| `/games/:id` | everyone | Game details and live availability |
| `/login` | everyone | Staff login (`/login/logout` logs out) |
| `/inventory` | staff, manager | Add / edit / delete games, mark copies out or back in |
| `/dashboard` | manager | Live bot activity, command counts, live inventory changes, bot status |
| `/staff` | manager | Create and delete staff accounts |

## Project structure

```
app.js                  Express set-up, sessions, template object, route protection
socket.js               Socket.IO set-up and the events the server sends
initdb.js               Creates the tables and seed data
models/                 Database access (one file per table, shared connection in db.js)
controllers/            One Express Router per page
views/                  Mustache pages and partials (header, navigation, footer, flash, availability)
public/js/              Browser Socket.IO code for the dashboard and the public pages
bot/bot.js              Discord client, runs commands and logs activity
bot/commands/           One file per slash command
bot/deploy-commands.js  Registers the slash commands with Discord
tests/                  Automated tests
docs/                   Requirements checklist, test report, demo checklist
```

## Database

- **Users**: id, username (unique), password (bcrypt hash), role (`staff` or `manager`)
- **Categories**: id, name
- **Games**: id, title (unique), category_id → Categories, min/max players, play time, total copies, available copies, description, updated_by → Users, updated_at
- **BotActivity**: id, discord_user, command, query, response, created_at

Foreign keys are switched on, so a game can't point at a category that doesn't exist.

## Real-time events (Socket.IO)

| Event | Sent to | When |
| --- | --- | --- |
| `inventory-updated` | everyone | Staff add, edit, delete or check a copy out or in |
| `bot-activity` | managers only | The bot answers a slash command |
| `bot-status` | managers only | The bot logs in or disconnects |

The Socket.IO server reads the same Express session as the website, so only sockets that belong to a logged-in manager join the `managers` room.

## Running the tests

```powershell
npm test
```

Each test file uses its own temporary database, so your `rollingdie.db` is never touched. See [docs/TESTING.md](docs/TESTING.md) for the results.

## Security notes

- Passwords are hashed with bcryptjs; logins compare against the hash.
- The session id is regenerated on login and the session is destroyed on logout.
- Inventory and manager pages are protected by middleware; staff get a 403 on manager pages.
- All changes use POST forms; all SQL uses `?` placeholders.
- Mustache escapes all output, and the dashboard script inserts Discord text with `textContent`.
- Secrets live in `.env`, which is listed in `.gitignore`. Only `.env.example` is committed.

## AI assistance

This assignment permits AI-assisted coding. Parts of this project were written with help from an AI coding assistant. I reviewed, ran and tested the code and can explain how it works.
