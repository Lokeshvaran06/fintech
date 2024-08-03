document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const depositForm = document.getElementById('depositForm');

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        const response = await fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const result = await response.json();
        console.log(result);
    });

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();
        console.log(result);

        if (result.token) {
            localStorage.setItem('token', result.token);
            registerForm.classList.add('hidden');
            loginForm.classList.add('hidden');
            depositForm.classList.remove('hidden');
        }
    });

    depositForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const accountId = document.getElementById('accountId').value;
        const amount = document.getElementById('amount').value;
        const token = localStorage.getItem('token');

        const response = await fetch('http://localhost:3000/deposit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ accountId, amount })
        });

        const result = await response.json();
        console.log(result);
    });
});
