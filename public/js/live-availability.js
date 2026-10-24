// Updates the availability badges on the public pages when staff change the inventory
const socket = io();

socket.on("inventory-updated", function(game) {
  const badges = document.querySelectorAll('[data-availability="' + game.id + '"]');

  badges.forEach(function(badge) {
    if (game.deleted)
    {
      badge.textContent = "No longer in our library";
      badge.className = "badge text-bg-secondary";
    }
    else if (game.available_copies == 0)
    {
      badge.textContent = "All " + game.total_copies + " in use";
      badge.className = "badge text-bg-danger";
    }
    else
    {
      badge.textContent = game.available_copies + " of " + game.total_copies + " available";
      badge.className = "badge " + (game.available_copies == 1 ? "text-bg-warning" : "text-bg-success");
    }
  });
});
