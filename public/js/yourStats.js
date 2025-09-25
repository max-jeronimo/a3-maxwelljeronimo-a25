document.addEventListener('DOMContentLoaded', async () => {
    const list = document.getElementById('gamesList');
    const statsDiv = document.getElementById('statsContent');
    let currentUser = null;

    async function loadUser() {
        const res = await fetch('/api/me');
        if (res.ok) {
            currentUser = await res.json();
        }
    }

    async function loadStats() {
        try {
            const res = await fetch('/api/my/stats');
            if (!res.ok) {
                statsDiv.textContent = "Error loading stats.";
                return;
            }

            const stats = await res.json();
            statsDiv.innerHTML = `
                <p><strong>Total Games:</strong> ${stats.totalGames}</p>
                <p><strong>Wins:</strong> ${stats.wins}</p>
                <p><strong>Losses:</strong> ${stats.losses}</p>
                <p><strong>Ties:</strong> ${stats.ties}</p>
            `;

            if (stats.byGameType) {
                const gameTypeList = Object.entries(stats.byGameType)
                    .map(([game, gStats]) => `
                        <li>${game}: ${gStats.wins}W - ${gStats.losses}L - ${gStats.ties}T (Total: ${gStats.total})</li>
                    `)
                    .join("");
                statsDiv.innerHTML += `<ul>${gameTypeList}</ul>`;
            }
        } catch (err) {
            console.error(err);
            statsDiv.textContent = "Server error loading stats.";
        }
    }

    async function loadGames() {
        const res = await fetch('/api/games');
        if (!res.ok) {
            list.innerHTML = "<li class='list-group-item'>Not Logged In!</li>";
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
            li.className = "list-group-item";
            li.textContent = `[${game.gameType}] ${partnerText} vs ${opponentText} | Score: ${formattedScore} (${outcome})`;

            list.appendChild(li);
        });
    }

    await loadUser();
    await loadStats();
    await loadGames();
});
