document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('/expert-login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            localStorage.setItem('expertToken', data.token);
            window.location.href = 'expert-dashboard.html';
        } else {
            document.getElementById('login-message').textContent = data.error;
        }
    })
    .catch(error => console.error('Error:', error));
});
