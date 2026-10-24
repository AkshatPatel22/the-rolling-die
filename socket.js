// Socket.IO set-up and the events the server pushes to browsers.
const { Server } = require('socket.io');

let io;
let botStatus = { online: false, tag: null };

function init(server, sessionMiddleware)
{
  io = new Server(server);

  // share the Express session so we know who is connected
  io.engine.use(sessionMiddleware);

  io.on('connection', function(socket) {
    const session = socket.request.session;

    // only managers join the room that receives bot activity
    if (session && session.role == "manager")
    {
      socket.join("managers");
      socket.emit("bot-status", botStatus);
    }
  });

  return io;
}

// Everyone (public pages and staff) hears about copy count changes
function inventoryChanged(game)
{
  if (io) io.emit("inventory-updated", game);
}

// Only the manager dashboard hears about bot activity
function botActivity(row)
{
  if (io) io.to("managers").emit("bot-activity", row);
}

function setBotStatus(status)
{
  botStatus = status;
  if (io) io.to("managers").emit("bot-status", botStatus);
}

module.exports = { init, inventoryChanged, botActivity, setBotStatus };
