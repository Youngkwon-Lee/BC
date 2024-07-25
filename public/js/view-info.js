document.addEventListener("DOMContentLoaded", function () {
    fetch('/health-data')
        .then(response => response.json())
        .then(data => {
            // 걸음수 데이터를 로드합니다
            const stepsData = data.steps.map(entry => entry.count);
            const labels = data.steps.map(entry => entry.date);
            const totalSteps = stepsData.reduce((a, b) => a + b, 0);

            // 걸음수 데이터를 차트로 시각화합니다
            const ctx = document.getElementById('stepsChart').getContext('2d');
            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '걸음수',
                        data: stepsData,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });

            // 걸음수 데이터를 텍스트로 표시합니다
            document.getElementById('steps-data').textContent = `총 걸음수: ${totalSteps}`;

            // 걸음수가 3000 이상일 경우 보상 요청
            if (totalSteps >= 3000) {
                const address = '사용자_이더리움_주소'; // 사용자 이더리움 주소를 입력합니다
                fetch('/set-reward', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ address, steps: totalSteps })
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Reward set:', data);

                    // 보상 청구
                    fetch('/claim-reward', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ address })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.message === 'Reward claimed successfully') {
                            console.log('Reward claimed:', data);
                        } else {
                            console.error('Reward already claimed for today or other error:', data);
                        }
                    })
                    .catch(error => console.error('Error claiming reward:', error));
                })
                .catch(error => console.error('Error setting reward:', error));
            }

            // 총 NFT 개수 조회
            fetch('/total-nfts')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('total-nfts').textContent = `총 NFT 개수: ${data.totalNFTs}`;
                })
                .catch(error => console.error('Error fetching total NFTs:', error));
        })
        .catch(error => console.error('Error fetching the data:', error));
});

// NFT를 티켓으로 교환하는 함수
function exchangeNFTs() {
    const address = '사용자_이더리움_주소'; // 사용자 이더리움 주소를 입력합니다
    const ticketType = document.getElementById('ticket-type').value;
    const tokenIds = document.getElementById('nft-ids').value.split(',').map(id => parseInt(id.trim()));

    fetch('/exchange-nfts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address, tokenIds, ticketType })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'NFTs exchanged for ticket successfully') {
            console.log('NFTs exchanged for ticket:', data);
        } else {
            console.error('Error exchanging NFTs for ticket:', data);
        }
    })
    .catch(error => console.error('Error exchanging NFTs for ticket:', error));
}

document.getElementById('exchange-button').addEventListener('click', exchangeNFTs);

// NFT를 피트니스 센터에 전송하는 함수
function transferNFTToFitnessCenter() {
    const address = '사용자_이더리움_주소'; // 사용자 이더리움 주소를 입력합니다
    const tokenId = document.getElementById('nft-token-id').value;

    fetch('/transfer-nft-to-fitness-center', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address, tokenId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'NFT transferred successfully') {
            console.log('NFT transferred to fitness center:', data);
        } else {
            console.error('Error transferring NFT:', data);
        }
    })
    .catch(error => console.error('Error transferring NFT:', error));
}

document.getElementById('transfer-button').addEventListener('click', transferNFTToFitnessCenter);
