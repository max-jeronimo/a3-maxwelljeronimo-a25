document.addEventListener('DOMContentLoaded', async () => {
    const gamePlayedForm = document.getElementById('gameForm');
    const container = document.getElementById('dynamicForm');
    const list = document.getElementById('gamesList');


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

        games.forEach((game) => {
            const li = document.createElement('li')

            const formattedScore = `${game.myScore} - ${game.opponentScore}`;
            const outcome = game.myScore > game.opponentScore ? "Win" :
                game.myScore < game.opponentScore ? "Lose" : "Tie";

            const meText = currentUser ? `${currentUser.displayName} (me)` : "me";
            const partnerText = game.partner ? `${game.partner} + ${meText}` : meText;
            const opponentText = game.opponents.join(', ');


            li.textContent = `[${game.gameType}] ${partnerText} vs ${opponentText} | Score: ${formattedScore} (${outcome})`;

            const deleteButton = document.createElement('button');
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener('click', () => deleteGame(game._id));

            li.appendChild(document.createTextNode(" "));
            li.appendChild(deleteButton);

            list.appendChild(li);
        });
    }

    function attachGameFormHandler() {
        const form = document.getElementById('logForm');
        if (!form)
            return;

        form.addEventListener('submit', async e => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(form).entries());

            const res = await fetch('/api/games', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data),
            });

            if (res.ok) {
                form.reset();
                container.innerHTML = '';
                loadGames();
            } else {
                const err = await res.json();
                alert(err.error || "Error adding game");
            }
        });
    }

    async function deleteGame(id) {
        const res = await fetch(`/api/games/${id}`, {method: 'DELETE'});
        if (res.ok) {
            loadGames();
        } else {
            const err = await res.json()
            alert(err.error || "Error deleting game");
        }
    }

    gamePlayedForm.addEventListener('submit', e => {
        e.preventDefault();
        const gamePlayed = document.getElementById('gamePlayed').value;

        if (gamePlayed === "pingPong") {
            container.innerHTML = `
        <form id="logForm">
          <input type="hidden" name="gameType" value="pingPong">
          <label>Opponent:</label>
          <input type="text" name="opponents" required><br>
          <label>My Score:</label>
          <input type="number" name="myScore" required><br>
          <label>Opponent Score:</label>
          <input type="number" name="opponentScore" required><br>
          <button type="submit">Add Game</button>
        </form>`;
        }

        if (gamePlayed === "cornHole") {
            container.innerHTML = `
        <form id="logForm">
          <input type="hidden" name="gameType" value="cornHole">
          <label>Partner:</label>
          <input type="text" name="partner" required><br>
          <label>Opponents (comma-separated, 2 names):</label>
          <input type="text" name="opponents" required><br>
          <label>My Team Score:</label>
          <input type="number" name="myScore" required><br>
          <label>Opponent Team Score:</label>
          <input type="number" name="opponentScore" required><br>
          <button type="submit">Add Game</button>
        </form>`;
        }

        if (gamePlayed === "marioKart") {
            container.innerHTML = `
        <form id="logForm">
            <input type = "hidden" name="gameType" value="marioKart">
                <label>Opponents (comma-separated):</label>
                <input type="text" name="opponents" required><br>
                <label>My Score:</label>
                <input type="number" name="myScore" required><br>
                <label>Opponents' Score:</label>
                <input type="number" name="opponentScore" required><br>
                <button type="submit">Add Game</button>
        </form>`;
        }
        attachGameFormHandler();
    });
    await loadUser();
    loadGames();
})