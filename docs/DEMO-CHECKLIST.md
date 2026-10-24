# Demonstration Checklist

Follow this in order while recording. Times are rough guides.

## Before recording

- [ ] `.env` has `SESSION_SECRET`, `DISCORD_TOKEN`, `DISCORD_CLIENT_ID` and `DISCORD_GUILD_ID` filled in
- [ ] The bot is invited to your Discord server
- [ ] Commands are registered: `npm run deploy-commands` (prints "Registered 4 commands")
- [ ] Reset the data so the demo starts clean: `npm run initdb`
- [ ] Have two browser windows ready: a normal window and a private/incognito window (two different logins at once)
- [ ] Have Discord open
- [ ] **Don't show the `.env` file on screen** (it contains your bot token)

## 1. Project and code tour (2 min)

- [ ] Show the folder structure in VS Code: `models/`, `views/`, `controllers/`, `bot/commands/`, `socket.js`
- [ ] Open `app.js`: session middleware, the `req.TPL` template object, `requireLogin` / `requireManager`, controllers mounted with `app.use`
- [ ] Open one controller (`controllers/inventory.js`) and its model (`models/games.js`) to show MVC
- [ ] Open `bot/commands/check.js` to show the slash command layout from class
- [ ] Show `.gitignore` (`.env` and `*.db` are ignored) and `.env.example`
- [ ] Run `git log --oneline` to show the incremental commits

## 2. Start the app (1 min)

```powershell
npm start
```

- [ ] Terminal shows `The Rolling Die is running at http://localhost:3000`
- [ ] Terminal shows `Discord bot logged in as ...`

## 3. Customer view (2 min)

- [ ] Open <http://localhost:3000>: home page with shelf totals and "Available right now"
- [ ] Click **Games**: all 12 games with green / yellow / red availability badges
- [ ] Search `pan` (finds Pandemic and Wingspan), then filter by category **Co-op**
- [ ] Open **Wingspan**: shows "All 1 in use"
- [ ] Try <http://localhost:3000/inventory> while logged out: redirected to login
- [ ] Shrink the browser window to phone width to show the Bootstrap layout and menu button

## 4. Login and sessions (2 min)

- [ ] Log in with a wrong password: "Invalid username or password."
- [ ] Log in as `staff1` / `staff123`: lands on Inventory, navbar shows "Signed in as staff1"
- [ ] Visit <http://localhost:3000/dashboard> as staff: 403 "only available to managers"
- [ ] Optional: open `rollingdie.db` in a SQLite viewer (or the VS Code SQLite extension) to show the `Users.password` column holds bcrypt hashes, not plain text

## 5. Inventory CRUD (3 min), logged in as staff1

- [ ] **Add game** with a blank title and max players lower than min: validation errors shown
- [ ] Add a real game, e.g. *Carcassonne*, Family, 2-5 players, 40 min, 2 copies, 2 available: success message, appears in table
- [ ] **Edit** it (change the copies to 3/3): change saved, "Last update ... by staff1"
- [ ] **− Out** on Catan: copies go from 2/3 to 1/3
- [ ] **+ In** on Catan: back to 2/3
- [ ] **Delete** Carcassonne (confirm the popup): removed

## 6. Live updates with Socket.IO (2 min)

- [ ] In the private window, open <http://localhost:3000/games> (logged out, like a customer)
- [ ] In the staff window, click **− Out** on Catan
- [ ] Show that the customer's Catan badge changed **without refreshing**

## 7. Manager dashboard and Discord bot (4 min)

- [ ] Log out, then log in as `priya` / `manager123`; open **Dashboard**
- [ ] Point out the **Live** and **Bot online** badges
- [ ] Put Discord and the dashboard side by side, then run:
  - [ ] `/check game:Catan`: available count
  - [ ] `/check game:Wingspan`: all copies in use
  - [ ] `/check game:Monopoly`: not in the library
  - [ ] `/available category:Party`
  - [ ] `/players count:6`
  - [ ] `/help`
- [ ] After each command, show the new row appearing at the top of **Live bot activity** and the **Commands used** counts going up, without refreshing
- [ ] In the staff window, click **− Out** on a game: it appears under **Live inventory changes**, and `/check` in Discord now shows the new count
- [ ] Refresh the dashboard: the activity is still there (saved in the `BotActivity` table)

## 8. Manager-only staff accounts (1 min)

- [ ] **Staff** page: create `demo_staff` / `demo123`
- [ ] Log out and log in as `demo_staff` to show the account works
- [ ] **Logout**: back to the public home page; `/inventory` redirects to login again

## 9. Tests (1 min)

```powershell
npm test
```

- [ ] Show `# pass 23` and `# fail 0`
