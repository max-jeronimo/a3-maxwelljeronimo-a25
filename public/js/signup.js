document.getElementById('signupForm').addEventListener('submit', async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());

    const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (res.ok) {
        window.location.href = '/mainPage.html';
    } else {
        const err = await res.json();
        alert(err.error || 'Signup failed');
    }
});