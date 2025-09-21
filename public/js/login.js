document.getElementById('loginForm').addEventListener('submit', async e => {
    e.preventDefault();

    const formData= new FormData(e.target);
    const body = Object.fromEntries(formData.entries());

    const res = await fetch('/api/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
    });

    if (res.ok) {
        window.location.href = '/mainPage.html';
    } else {
        const err = await res.json();
        alert(err.error || "Login Failed");
    }
});