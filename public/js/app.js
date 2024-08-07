document.addEventListener("DOMContentLoaded", () => {
    // Dropdown functionality for pain assessment form
    window.toggleDropdown = function(id) {
        const element = document.getElementById(id);
        element.classList.toggle('hidden');
    }

    // Handle form submission for pain assessment
    const painAssessmentForm = document.getElementById('pain-assessment-form');
    if (painAssessmentForm) {
        painAssessmentForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(painAssessmentForm);
            let totalPainScore = 0;

            formData.forEach((value, key) => {
                if (key === 'pain-intensity') {
                    totalPainScore += parseInt(value);
                }
            });

            if (typeof window.ethereum !== 'undefined') {
                const web3 = new Web3(window.ethereum);
                await window.ethereum.request({ method: 'eth_requestAccounts' });

                const accounts = await web3.eth.getAccounts();
                const networkId = await web3.eth.net.getId();
                const HealthData = new web3.eth.Contract(
                    HealthData_ABI,
                    HealthData_Address
                );

                HealthData.methods.submitPainScore(totalPainScore).send({ from: accounts[0] })
                    .on('receipt', function (receipt) {
                        alert('Pain score submitted successfully!');
                    })
                    .on('error', function (error) {
                        console.error(error);
                        alert('Failed to submit pain score.');
                    });
            }
        });
    }

    // Calculate total score for Berg Balance Scale
    const radioButtons = document.querySelectorAll('#bbs-test-dropdown input[type="radio"]');
    if (radioButtons.length > 0) {
        radioButtons.forEach(radio => {
            radio.addEventListener('change', calculateTotalScore);
        });
    }

    function calculateTotalScore() {
        let totalScore = 0;
        radioButtons.forEach(radio => {
            if (radio.checked) {
                totalScore += parseInt(radio.value);
            }
        });
        document.getElementById('total-score').innerText = totalScore;
        return totalScore;
    }

    const submitScoreButton = document.getElementById('submit-score');
    if (submitScoreButton) {
        submitScoreButton.addEventListener('click', async (event) => {
            event.preventDefault();
            const totalScore = calculateTotalScore();

            if (typeof window.ethereum !== 'undefined') {
                const web3 = new Web3(window.ethereum);
                await window.ethereum.request({ method: 'eth_requestAccounts' });

                const accounts = await web3.eth.getAccounts();
                const networkId = await web3.eth.net.getId();
                const HealthData = new web3.eth.Contract(
                    HealthData_ABI,
                    HealthData_Address
                );

                HealthData.methods.submitBalanceScore(totalScore).send({ from: accounts[0] })
                    .on('receipt', function (receipt) {
                        alert('Balance score submitted successfully!');
                    })
                    .on('error', function (error) {
                        console.error(error);
                        alert('Failed to submit balance score.');
                    });
            }
        });
    }

    // Chatbot submit button functionality
    const submitButton = document.getElementById('submit-button');
    if (submitButton) {
        submitButton.addEventListener('click', async () => {
            const userInput = document.getElementById('user-input').value;
            if (userInput.trim() === "") return;

            // Display the user's message
            const messages = document.getElementById('messages');
            const userMessage = document.createElement('div');
            userMessage.classList.add('bg-blue-100', 'p-2', 'my-2', 'rounded');
            userMessage.textContent = userInput;
            messages.appendChild(userMessage);

            // Clear the input field
            document.getElementById('user-input').value = "";

            try {
                // Call ChatGPT API
                const response = await fetch('/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ text: userInput })
                });

                if (response.ok) {
                    const data = await response.json();
                    const botMessage = document.createElement('div');
                    botMessage.classList.add('bg-gray-100', 'p-2', 'my-2', 'rounded');
                    botMessage.textContent = data.response;
                    messages.appendChild(botMessage);
                    messages.scrollTop = messages.scrollHeight;
                } else {
                    throw new Error('Network response was not ok.');
                }
            } catch (error) {
                console.error('Error fetching ChatGPT response:', error);
                const errorMessage = document.createElement('div');
                errorMessage.classList.add('bg-red-100', 'p-2', 'my-2', 'rounded');
                errorMessage.textContent = "Failed to get response from ChatGPT.";
                messages.appendChild(errorMessage);
                messages.scrollTop = messages.scrollHeight;
            }
        });
    }

    // Handle profile picture upload
    const profileUploadInput = document.getElementById('profile-picture');
    profileUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const profileImage = document.getElementById('profile-picture-display');
                profileImage.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Handle search condition
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
        searchButton.addEventListener('click', async () => {
            const searchInput = document.getElementById('search-input').value.trim();
            if (searchInput === "") return;

            try {
                const response = await fetch(`/search?condition=${encodeURIComponent(searchInput)}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    const searchResults = document.getElementById('search-results');
                    searchResults.innerHTML = `<h3 class="text-xl font-bold mb-4">Search Results:</h3>`;
                    data.results.forEach(result => {
                        const p = document.createElement('p');
                        p.textContent = result;
                        searchResults.appendChild(p);
                    });
                } else {
                    throw new Error('Network response was not ok.');
                }
            } catch (error) {
                console.error('Error fetching search results:', error);
                const searchResults = document.getElementById('search-results');
                searchResults.innerHTML = `<p class="text-red-500">Failed to get search results.</p>`;
            }
        });
    }
});

// Replace with your contract's ABI and Address
const HealthData_ABI = [
    // Your contract's ABI
];
const HealthData_Address = '0xYourContractAddress';
