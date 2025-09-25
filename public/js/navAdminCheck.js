document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('/api/me');
        if (res.ok) {
            const user = await res.json();
            if (user.role === 'admin') {
                const navLinks = document.getElementById('navLinks');
                if (navLinks) {
                    const adminBtn = document.createElement('a');
                    adminBtn.href = "/adminPage.html";
                    adminBtn.className = "btn btn-warning me-2";
                    adminBtn.textContent = "Admin Panel";
                    navLinks.prepend(adminBtn);
                }
            }
        }
    } catch (err) {
        console.error("Failed to check user role:", err);
    }
});
