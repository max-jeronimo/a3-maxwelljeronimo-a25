document.addEventListener('DOMContentLoaded', async () => {
    const list = document.getElementById('gamesList');
    const editModal = document.getElementById('editModal');
    const editFormContainer = document.getElementById('editFormContainer');
    const closeEditModal = document.getElementById('closeEditModal');

    let currentUser = null;

    async function loadUser() {
        const res = await fetch('/api/me');
        if (res.ok) currentUser = await res.json();
    }

    async function loadGames() {
        const res = await fetch('/api/games');
        if (!res.ok) {
            list.innerHTML = `<li class="list-group-item text-danger">Not logged in!</li>`;
            return;
        }

        const games = await res.json();
        list.innerHTML = '';

        games.forEach(game => {
            const formattedScore = `${game.myScore} - ${game.opponentScore}`;
            const outcome = game.myScore > game.opponentScore ? "Win" :
                game.myScore < game.opponentScore ? "Lose" : "Tie";

            const meText = currentUser ? `${currentUser.displayName} (me)` : "me";
            const partnerText = game.partner ? `${game.partner} + ${meText}` : meText;
            const opponentText = game.opponents.join(', ');

            const li = document.createElement('li');
            li.className = "list-group-item d-flex justify-content-between align-items-center";
            li.innerHTML = `
        <div>
          <strong>[${game.gameType}]</strong> 
          ${partnerText} vs ${opponentText} |
          Score: ${formattedScore} 
          <span class="badge ${outcomeBadge(outcome)} ms-2">${outcome}</span>
        </div>
        <div>
          <button class="btn btn-sm btn-primary me-1" onclick="openEditModal('${game._id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteGame('${game._id}')">Delete</button>
        </div>
      `;
            list.appendChild(li);
        });
    }

    function outcomeBadge(outcome) {
        switch(outcome) {
            case "Win": return "bg-success";
            case "Lose": return "bg-danger";
            default: return "bg-secondary";
        }
    }

    window.openEditModal = async function(gameId) {
        const res = await fetch(`/api/games/${gameId}`);
        if (!res.ok) return alert("Failed to fetch game");
        const game = await res.json();

        const partnerDisabled = (game.gameType === "pingPong" || game.gameType === "marioKart");

        editFormContainer.innerHTML = `
      <form id="editForm" class="p-2">
        <input type="hidden" name="gameId" value="${game._id}">
        <div class="mb-2">
          <label class="form-label">Partner</label>
          <input type="text" class="form-control" name="partner" value="${game.partner || ""}" ${partnerDisabled ? "disabled" : ""}>
        </div>
        <div class="mb-2">
          <label class="form-label">Opponents</label>
          <input type="text" class="form-control" name="opponents" value="${game.opponents.join(", ")}" required>
        </div>
        <div class="mb-2">
          <label class="form-label">My Score</label>
          <input type="number" class="form-control" name="myScore" value="${game.myScore}" required>
        </div>
        <div class="mb-2">
          <label class="form-label">Opponent Score</label>
          <input type="number" class="form-control" name="opponentScore" value="${game.opponentScore}" required>
        </div>
        <button type="submit" class="btn btn-success">Save Changes</button>
      </form>
    `;

        editModal.style.display = 'block';

        const form = document.getElementById('editForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(form).entries());

            const res = await fetch(`/api/games/${data.gameId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                editModal.style.display = 'none';
                loadGames();
            } else {
                const err = await res.json();
                alert(err.error || "Error updating game");
            }
        });
    }

    window.deleteGame = async function(id) {
        if (!confirm("Delete this game?")) return;
        const res = await fetch(`/api/games/${id}`, { method: 'DELETE' });
        if (res.ok) loadGames();
        else alert("Error deleting game");
    }

    closeEditModal.onclick = () => editModal.style.display = 'none';
    window.onclick = e => { if (e.target === editModal) editModal.style.display = 'none'; };

    await loadUser();
    loadGames();
});
