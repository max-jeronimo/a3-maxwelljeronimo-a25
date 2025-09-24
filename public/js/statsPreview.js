document.addEventListener('DOMContentLoaded', async () => {
    const statsDiv = document.getElementById('statsPreview');

    try {
        const res = await fetch('/api/my/stats');
        if (!res.ok) {
            statsDiv.textContent = "Failed to load stats.";
            return;
        }

        const stats = await res.json();

        statsDiv.innerHTML = `
            <p><strong>Total Games:</strong> ${stats.totalGames}</p>
            <p><strong>Wins:</strong> ${stats.wins}, 
               <strong>Losses:</strong> ${stats.losses}, 
               <strong>Ties:</strong> ${stats.ties}</p>
            <h4>By Game Type:</h4>
            <ul>
              ${Object.entries(stats.byGameType).map(([type, s]) =>
            `<li>${type}: ${s.wins}-${s.losses}-${s.ties} (Total ${s.total})</li>`
        ).join("")}
            </ul>
        `;
    } catch (err) {
        console.error(err);
        statsDiv.textContent = "Error loading stats.";
    }
});