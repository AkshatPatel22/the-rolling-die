// Live updates for the manager dashboard
const socket = io();

const socketStatus = document.getElementById("socket-status");
const botStatus = document.getElementById("bot-status");
const activityBody = document.getElementById("activity-body");
const commandCounts = document.getElementById("command-counts");
const totalCount = document.getElementById("total-count");
const inventoryFeed = document.getElementById("inventory-feed");

function setBadge(element, text, colour)
{
  element.textContent = text;
  element.className = "badge text-bg-" + colour;
}

// Make a table cell using textContent so Discord input can't inject HTML
function cell(text, className)
{
  const td = document.createElement("td");
  td.textContent = text;
  if (className) td.className = className;
  return td;
}

socket.on("connect", function() { setBadge(socketStatus, "Live", "success"); });
socket.on("disconnect", function() { setBadge(socketStatus, "Disconnected", "danger"); });

socket.on("bot-status", function(status) {
  if (status.online) setBadge(botStatus, "Bot online: " + status.tag, "success");
  else setBadge(botStatus, "Bot offline", "secondary");
});

socket.on("bot-activity", function(row) {
  const empty = document.getElementById("no-activity");
  if (empty) empty.remove();

  // new row at the top of the table
  const tr = document.createElement("tr");
  tr.className = "table-success";
  tr.appendChild(cell(row.created_at, "text-nowrap small"));
  tr.appendChild(cell(row.discord_user));
  const commandCell = document.createElement("td");
  const code = document.createElement("code");
  code.textContent = "/" + row.command;
  commandCell.appendChild(code);
  tr.appendChild(commandCell);
  tr.appendChild(cell(row.query || ""));
  tr.appendChild(cell(row.response, "small"));
  activityBody.prepend(tr);
  setTimeout(function() { tr.className = ""; }, 3000);

  // keep the table to the 25 most recent rows
  while (activityBody.children.length > 25) activityBody.lastElementChild.remove();

  // update the counters
  totalCount.textContent = parseInt(totalCount.textContent) + 1;
  let item = commandCounts.querySelector('[data-command="' + row.command + '"]');
  if (!item)
  {
    const noCounts = document.getElementById("no-counts");
    if (noCounts) noCounts.remove();
    item = document.createElement("li");
    item.className = "list-group-item d-flex justify-content-between";
    item.dataset.command = row.command;
    const name = document.createElement("code");
    name.textContent = "/" + row.command;
    const badge = document.createElement("span");
    badge.className = "badge text-bg-primary rounded-pill";
    badge.textContent = "0";
    item.append(name, badge);
    commandCounts.appendChild(item);
  }
  const badge = item.querySelector(".badge");
  badge.textContent = parseInt(badge.textContent) + 1;
});

socket.on("inventory-updated", function(game) {
  const li = document.createElement("li");
  li.className = "list-group-item small";
  const time = new Date().toLocaleTimeString();
  if (game.deleted) li.textContent = time + " - " + game.title + " was removed";
  else li.textContent = time + " - " + game.title + ": " + game.available_copies + " of " + game.total_copies + " on the shelf";
  inventoryFeed.prepend(li);
  while (inventoryFeed.children.length > 10) inventoryFeed.lastElementChild.remove();
});
