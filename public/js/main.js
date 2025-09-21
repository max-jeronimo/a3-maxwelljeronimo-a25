async function loadStats() {
    const res = await fetch('/api/games');
    if (!res.ok) {
        console.error("Couldn't Load Games");
        return;
    }

    const games = await res.json()
    let wins = 0
    let losses = 0
    let ties = 0

    games.forEach(g => {
        if (g.myScore > g.opponentScore)
            wins++;
        else if (g.myScore < g.opponentScore)
            losses++;
        else
            ties++;
    });

    document.getElementById('totalGames').innerText = games.length;
    document.getElementById('wins').innerText = wins;
    document.getElementById('losses').innerText = losses;
    document.getElementById('ties').innerText = ties;
}

fetch('/api/me')
    .then(res => {
        if (!res.ok) throw new Error('Not logged in');
        return res.json();
    })
    .then(user => {
        document.getElementById('welcome').innerText =
            "Welcome, " + user.displayName + "!";

        if (user.role === 'admin') {
            document.getElementById('adminPanel').style.display = 'inline';
        }

        loadStats();
    })
    .catch(() => {
        window.location.href = '/loginPage.html';
    });
