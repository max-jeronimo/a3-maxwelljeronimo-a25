document.addEventListener('DOMContentLoaded', () => {
    const gameChoiceForm = document.getElementById('gameChoiceForm');
    const gameFormContainer = document.getElementById('gameFormContainer');

    const gamesWithPartner = ['cornHole'];

    gameChoiceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const gamePlayed = document.getElementById('gamePlayed').value;
        if (!gamePlayed) return;
        renderGameForm(gamePlayed);
    });

    function renderGameForm(gamePlayed) {
        const needsPartner = gamesWithPartner.includes(gamePlayed);

        gameFormContainer.innerHTML = `
          <form id="gameForm" class="card p-4 shadow-sm">
            <h4 class="mb-3">Enter ${prettyName(gamePlayed)} Details</h4>
            <div class="row g-3">
              ${needsPartner ? `
              <div class="col-md-6">
                <input type="text" class="form-control" name="partner" placeholder="Partner (optional)">
              </div>` : ``}
              <div class="col-md-6">
                <input type="text" class="form-control" name="opponents" placeholder="Opponents (comma-separated)" required>
              </div>
              <div class="col-md-6">
                <input type="number" class="form-control" name="myScore" placeholder="My Score" required>
              </div>
              <div class="col-md-6">
                <input type="number" class="form-control" name="opponentScore" placeholder="Opponent Score" required>
              </div>
            </div>
            <button type="submit" class="btn btn-success mt-3">Submit Game</button>
          </form>
        `;

        const gameForm = document.getElementById('gameForm');
        gameForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(gameForm).entries());
            data.gameType = gamePlayed;

            try {
                const res = await fetch('/api/games', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(data)
                });

                if (res.ok) {
                    alert('Game added successfully!');
                    gameForm.reset();
                    gameChoiceForm.reset();
                    gameFormContainer.innerHTML = '';
                } else {
                    const err = await res.json();
                    alert(err.error || 'Error adding game');
                }
            } catch (err) {
                console.error(err);
                alert('Server error adding game');
            }
        });
    }

    function prettyName(key) {
        switch (key) {
            case 'marioKart': return 'Mario Kart';
            case 'pingPong': return 'Ping Pong';
            case 'cornHole': return 'Corn Hole';
            default: return key;
        }
    }
});
