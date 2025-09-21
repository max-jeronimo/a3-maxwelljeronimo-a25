async function loadUsers() {
    const res = await fetch('/api/admin/users');
    if (!res.ok) {
        alert("Failed to Load Users");
        return;
    }
    const users = await res.json();
    const table = document.getElementById('usersTable')
    table.innerHTML = '';

    users.forEach(user => {
        const row = document.createElement('tr');

        row.innerHTML = `
        <td>${user.email}</td>
        <td>${user.displayName}</td>
        <td>${user.role}</td>
        <td>
            <button onclick="makeAdmin('${user._id}')">Promote to Admin</button>
            <button onclick="removeUser('${user._id}')">Delete</button>
        </td>
        `;
        table.append(row);
    });
}

async function makeAdmin(userId) {
    const res = await fetch(`/api/admin/users/${userId}/promote`, { method: 'PUT' });
    if (res.ok) {
        loadUsers();
    } else {
        alert("Failed to Promote to Admin");
    }
}

async function removeUser(userId) {
    if (!confirm("Are you sure?")) return;
    const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
    if (res.ok) {
        loadUsers();
    } else {
        alert("Failed to delete user");
    }
}

document.addEventListener('DOMContentLoaded', loadUsers);