let currentUser = null;

async function loadUsers() {
    const res = await fetch('/api/admin/users');
    if (!res.ok) {
        alert("Failed to Load Users");
        return;
    }

    async function loadCurrentUser(){
        const res = await fetch('/api/me');
        if (res.ok) {
            currentUser = await res.json();
        }
    }

// This is the User Table, where you can promote or demote users, as well as delete them entirely
    const users = await res.json();
    const table = document.getElementById('usersTable');
    table.innerHTML = '';

    users.forEach(user => {
        const row = document.createElement('tr');

        let actionButtons = '';

        if (user.role === 'user') {
            actionButtons += `<button onClick="makeAdmin('${user._id}')">Promote to Admin</button>`;
        }

        if (user.role === 'admin') {
            if (user._id === (window.currentUserId || '')) {
                actionButtons += `<button disabled style="opacity:0.5; cursor:not-allowed;">Demote Admin</button>`;
            } else {
                actionButtons += `<button onClick="demoteAdmin('${user._id}')">Demote Admin</button>`;
            }
        }

        if (user._id === (window.currentUserId || '')) {
            actionButtons += `<button disabled style="opacity:0.5; cursor:not-allowed;">Delete</button>`;
        } else {
            actionButtons += `<button onclick="removeUser('${user._id}')">Delete</button>`;
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
    const res = await fetch(`/api/admin/users/${userId}/promote`, {method: 'PUT'});
    if (!confirm("Promote to Admin?")) return;
    if (res.ok)
        loadUsers();
    else alert("Failed to Promote to Admin");
}

async function demoteAdmin(userId) {
    const res = await fetch(`/api/admin/users/${userId}/demote`, {method: 'PUT'});
    if (!confirm("Demote to User?")) return;
    if (res.ok) loadUsers();
    else alert("Failed to Demote User");
}

async function removeUser(userId) {
    if (!confirm("Are you sure?")) return;
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

    // This the Games Table, where admins can view, edit, and delete any game that has been logged.
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
            <button onclick="openEditModal('${game._id}')">Edit</button>
            <button onclick="deleteGame('${game._id}')">Delete</button>
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
    if (!confirm("Delete this Game?")) return;
    const res = await fetch(`/api/admin/games/${id}`, {method: 'DELETE'});
    if (res.ok) loadGames();
    else alert("Error deleting game");
}

document.addEventListener('DOMContentLoaded', async () => {
    const meRes = await fetch('/api/me');
    if (meRes.ok) {
        const me = await meRes.json();
        window.currentUserId = me.id;
    }

    await loadUsers();
    await loadGames();

    const editModal = document.getElementById('editModal');
    const closeEditModal = document.getElementById('closeEditModal');
    closeEditModal.onclick = () => editModal.style.display = 'none';
    window.onclick = e => {
        if (e.target === editModal) editModal.style.display = 'none';
    };
});
