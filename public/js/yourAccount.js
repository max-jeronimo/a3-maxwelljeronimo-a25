document.addEventListener('DOMContentLoaded', async () => {
    const accountDiv = document.getElementById('accountInfo');
    const modal = document.getElementById('editAccount');
    const modalFormContainer = document.getElementById('modalFormContainer');
    const closeModal = document.getElementById('closeModal');


    async function loadAccount() {
        try {
            const res = await fetch('/api/my/account')
            if (!res.ok) {
                accountDiv.textContent = "Failed to Load Account Details"
                return;
            }

            const user = await res.json();
            accountDiv.innerHTML = `
        <p><strong>Display Name: ${user.displayName}</strong></p>
        <p><strong>Email: ${user.email}</strong></p>
        `;
        } catch (err) {
            console.log(err);
            accountDiv.textContent = "Error Loading Account Details"
        }
    }

    function openModal(formHtml) {
        modalFormContainer.innerHTML = formHtml;
        modal.style.display = 'block';
        attachFormHandler();
    }

    function closeModalFunction() {
        modal.style.display = 'none';
    }

    closeModal.onclick = closeModalFunction;
    window.onclick = e => {
        if (e.target === modal)
            closeModalFunction();
    };

    function attachFormHandler() {
        const form = document.getElementById('account')
        if (!form)
            return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(form).entries());
            let url = '';
            let method = 'PUT';

            if (form.dataset.type === 'displayName')
                url = '/api/my/account/displayName';
            if (form.dataset.type === 'email')
                url = '/api/my/account/email';
            if (form.dataset.type === 'password')
                url = '/api/my/account/password';

            const res = await fetch(url, {
                method: method,
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            })

            if (res.ok) {
                alert("Update Successful")
                closeModalFunction();
                loadAccount();
            } else {
                const err = await res.json();
                alert(err.error || "Error Updating Account")
            }
        });
    }

    document.getElementById('changeDisplayName').onclick = () => {
        openModal(`
        <form id="account" data-type="displayName">
            <label>New Display Name:</label><br>
            <input type='text' name="displayName" required<br><br>
            <button type="submit">Update</button>
        </form>
        `);
    };

    document.getElementById('changeEmail').onclick = () => {
        openModal(`
        <form id="account" data-type="email">
            <label>New Display Name:</label><br>
            <input type='text' name="email" required<br><br>
            <button type="submit">Update</button>
        </form>
        `);
    };

    document.getElementById('changePassword').onclick = () => {
        openModal(`
        <form id="account" data-type="password">
            <label>Old Password:</label><br>
            <input type='text' name="oldPassword" required<br><br>
            <label>New Password:</label><br>
            <input type='password' name="newPassword" required<br><br></input>
            <button type="submit">Update</button>
        </form>
        `);
    };

    loadAccount();
})