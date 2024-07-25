document.getElementById('evaluation-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const userAddress = document.getElementById('user-address').value;
    const evaluation = document.getElementById('evaluation').value;
    const token = localStorage.getItem('expertToken');

    fetch('/submit-evaluation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userAddress, evaluation })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            document.getElementById('evaluation-message').textContent = data.message;
        } else {
            document.getElementById('evaluation-message').textContent = data.error;
        }
    })
    .catch(error => console.error('Error:', error));
});
