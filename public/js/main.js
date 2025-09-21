fetch('/api/me')
    .then(res => {
        if (!res.ok) throw new Error('Not logged in');
        return res.json();
    })
    .then(user => {
        document.getElementById('welcome').innerText =
            "Welcome, " + user.displayName + "!";
    })
    .catch(() => {
        window.location.href = '/loginPage.html';
    });
