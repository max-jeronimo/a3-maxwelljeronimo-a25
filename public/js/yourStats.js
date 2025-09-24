document.addEventListener('DOMContentLoaded', async () => {
    const list = document.getElementById('gamesList');
    const editModal = document.getElementById('editModal');
    const editFormContainer = document.getElementById('editFormContainer');
    const closeEditModal = document.getElementById('closeEditModal');
    let currentUser = null;

    async function loadUser() {
        const res = await fetch('/api/me');
        if (res.ok) {
            currentUser = await res.json();
        }
    }

    async function loadGames() {
        const res = await fetch('/api/games');
        if (!res.ok) {
            list.innerHTML = "<li>Not Logged In!</li>";
            return;
        }

        const games = await res.json();
        list.innerHTML = '';

        games.forEach(game => {
            const li = document.createElement('li');

            const formattedScore = `${game.myScore} - ${game.opponentScore}`;
            const outcome = game.myScore > game.opponentScore ? "Win" :
                game.myScore < game.opponentScore ? "Lose" : "Tie";

            const meText = currentUser ? `${currentUser.displayName} (me)` : "me";
            const partnerText = game.partner ? `${game.partner} + ${meText}` : meText;
            const opponentText = game.opponents.join(', ');

            li.textContent = `[${game.gameType}] ${partnerText} vs ${opponentText} | Score: ${formattedScore} (${outcome})`;

            const editButton = document.createElement('button');
            editButton.textContent = "Edit";
            editButton.addEventListener('click', () => openEditModal(game));

            const deleteButton = document.createElement('button');
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener('click', () => deleteGame(game._id));

            li.appendChild(document.createTextNode(" "));
            li.appendChild(editButton);
            li.appendChild(document.createTextNode(" "));
            li.appendChild(deleteButton);

            list.appendChild(li);
        });
    }


    function openEditModal(game){
        editFormContainer.innerHTML = `
            <form id="editForm">
              <input type="hidden" name="gameId" value="${game._id}">
              <input type="hidden" name="gameType" value="${game.gameType}">
              <label>Partner:</label>
              <input type="text" name="partner" value="${game.partner || ""}"><br>
              <label>Opponents (comma-separated):</label>
              <input type="text" name="opponents" value="${game.opponents.join(", ")}" required><br>
              <label>My Score:</label>
              <input type="number" name="myScore" value="${game.myScore}" required><br>
              <label>Opponent Score:</label>
              <input type="number" name="opponentScore" value="${game.opponentScore}" required><br>
              <button type="submit">Save Changes</button>
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

    closeEditModal.onclick = () => { editModal.style.display = 'none'; };
    window.onclick = e => { if (e.target === editModal) editModal.style.display = 'none'; };

    async function deleteGame(id) {
        const res = await fetch(`/api/games/${id}`, {method: 'DELETE'});
        if (res.ok) {
            loadGames();
        } else {
            const err = await res.json();
            alert(err.error || "Error deleting game");
        }
    }

    await loadUser();
    loadGames();
});
