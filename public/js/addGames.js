document.addEventListener('DOMContentLoaded', () => {
    const gamePlayedForm = document.getElementById('gameForm');
    const modal = document.getElementById('gameModal');
    const modalFormContainer = document.getElementById('modalFormContainer');
    const closeModal = document.getElementById('closeModal');

    function openModal(formHtml) {
        modalFormContainer.innerHTML = formHtml;
        modal.style.display = 'block';
        attachGameFormHandler()

    }

    closeModal.onclick = () => {
        modal.style.display = 'none';
    };
    window.onclick = e => {
        if (e.target === modal)
            modal.style.display = 'none';
    }

    function attachGameFormHandler() {
        const form = document.getElementById('logForm');
        if (!form) return;

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
                modal.style.display = 'none';
                alert("Game logged successfully!");
            } else {
                const err = await res.json();
                alert(err.error || "Error adding game");
            }
        });
    }

    gamePlayedForm.addEventListener('submit', e => {
        e.preventDefault();
        const gamePlayed = document.getElementById('gamePlayed').value;

        if (gamePlayed === "pingPong") {
            openModal(`
        <form id="logForm">
          <input type="hidden" name="gameType" value="pingPong">
          <label>Opponent:</label>
          <input type="text" name="opponents" required><br>
          <label>My Score:</label>
          <input type="number" name="myScore" required><br>
          <label>Opponent Score:</label>
          <input type="number" name="opponentScore" required><br>
          <button type="submit">Add Game</button>
        </form>`);
        }

        if (gamePlayed === "cornHole") {
            openModal(`
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
        </form>`);
        }

        if (gamePlayed === "marioKart") {
            openModal(`
        <form id="logForm">
          <input type="hidden" name="gameType" value="marioKart">
          <label>Opponents (comma-separated):</label>
          <input type="text" name="opponents" required><br>
          <label>My Score:</label>
          <input type="number" name="myScore" required><br>
          <label>Opponents' Score:</label>
          <input type="number" name="opponentScore" required><br>
          <button type="submit">Add Game</button>
        </form>`);
        }
    });
});
