let currentUserId = null;

async function loadCurrentUser() {
    const res = await fetch('/api/me');
    if (res.ok) {
        const me = await res.json();
        currentUserId = me.id;
    }
}

async function loadUsers() {
    const res = await fetch('/api/admin/users');
    if (!res.ok) {
        alert("Failed to load users");
        return;
    }

    const users = await res.json();
    const table = document.getElementById('usersTable');
    table.innerHTML = '';

    users.forEach(user => {
        const row = document.createElement('tr');

        let actionButtons = '';

        if (user.role === 'user') {
            actionButtons += `<button class="btn btn-sm btn-success me-1" onClick="makeAdmin('${user._id}')">Promote</button>`;
        }

        if (user.role === 'admin') {
            if (user._id === currentUserId) {
                actionButtons += `<button class="btn btn-sm btn-secondary me-1" disabled>Demote</button>`;
            } else {
                actionButtons += `<button class="btn btn-sm btn-warning me-1" onClick="demoteAdmin('${user._id}')">Demote</button>`;
            }
        }

        if (user._id === currentUserId) {
            actionButtons += `<button class="btn btn-sm btn-secondary" disabled>Delete</button>`;
        } else {
            actionButtons += `<button class="btn btn-sm btn-danger" onclick="removeUser('${user._id}')">Delete</button>`;
        }

        row.innerHTML = `
            <td>${user.email}</td>
            <td>${user.displayName}</td>  
            <td>${user.role}</td>
            <td>${actionButtons}</td>
        `;
        table.append(row);
    });
}

async function makeAdmin(userId) {
    if (!confirm("Promote to Admin?")) return;
    const res = await fetch(`/api/admin/users/${userId}/promote`, {method: 'PUT'});
    if (res.ok) loadUsers();
    else alert("Failed to promote user");
}

async function demoteAdmin(userId) {
    if (!confirm("Demote this admin to user?")) return;
    const res = await fetch(`/api/admin/users/${userId}/demote`, {method: 'PUT'});
    if (res.ok) loadUsers();
    else alert("Failed to demote admin");
}

async function removeUser(userId) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    const res = await fetch(`/api/admin/users/${userId}`, {method: 'DELETE'});
    if (res.ok) loadUsers();
    else alert("Failed to delete user");
}

async function loadGames() {
    const res = await fetch('/api/admin/games');
    if (!res.ok) {
        alert("Failed to load games");
        return;
    }

    const games = await res.json();
    const table = document.getElementById('gamesTable');
    table.innerHTML = '';

    games.forEach(game => {
        const row = document.createElement('tr');

        const formattedScore = `${game.myScore} - ${game.opponentScore}`;
        const outcome = game.myScore > game.opponentScore ? "Win" :
            game.myScore < game.opponentScore ? "Lose" : "Tie";
        const ownerName = game.userId?.displayName || "Unknown User";
        const partnerText = game.partner ? `${game.partner} + ${ownerName}` : ownerName;
        const opponentText = game.opponents.join(', ');

        const actionButtons = `
            <button class="btn btn-sm btn-primary me-1" onclick="openEditModal('${game._id}')">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteGame('${game._id}')">Delete</button>
        `;

        row.innerHTML = `
            <td>${game.gameType}</td>
            <td>${partnerText} vs ${opponentText}</td>
            <td>${formattedScore}</td>
            <td>${outcome}</td>
            <td>${actionButtons}</td>
        `;
        table.append(row);
    });
}

window.openEditModal = function (gameId) {
    fetch(`/api/admin/games/${gameId}`)
        .then(res => res.json())
        .then(game => {
            const editModal = document.getElementById('editModal');
            const editFormContainer = document.getElementById('editFormContainer');
            editFormContainer.innerHTML = `
                <form id="editForm" class="p-2">
                  <input type="hidden" name="gameId" value="${game._id}">
                  <input type="hidden" name="gameType" value="${game.gameType}">
                  <div class="mb-2">
                    <label class="form-label">Partner</label>
                    <input type="text" class="form-control" name="partner" value="${game.partner || ""}">
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

            document.getElementById('editForm').onsubmit = async (e) => {
                e.preventDefault();
                const data = Object.fromEntries(new FormData(e.target).entries());

                const res = await fetch(`/api/admin/games/${data.gameId}`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(data),
                });

                if (res.ok) {
                    editModal.style.display = 'none';
                    loadGames();
                } else {
                    const err = await res.json();
                    alert(err.error || "Error updating game");
                }
            };
        });
}

window.deleteGame = async function (id) {
    if (!confirm("Delete this game?")) return;
    const res = await fetch(`/api/admin/games/${id}`, {method: 'DELETE'});
    if (res.ok) loadGames();
    else alert("Error deleting game");
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadCurrentUser();
    await loadUsers();
    await loadGames();

    const editModal = document.getElementById('editModal');
    const closeEditModal = document.getElementById('closeEditModal');
    closeEditModal.onclick = () => editModal.style.display = 'none';
    window.onclick = e => {
        if (e.target === editModal) editModal.style.display = 'none';
    };
});
