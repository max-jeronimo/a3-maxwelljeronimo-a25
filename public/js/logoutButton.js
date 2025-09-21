document.getElementById('logoutButton').addEventListener('click', async () => {
    const res = await fetch('/api/logout', {method: 'POST'})

    if (res.ok) {
        window.location.href = '/loginPage.html';
    } else {
        const err = await res.json();
        alert(err.error || "Logout Failed")
    }
});