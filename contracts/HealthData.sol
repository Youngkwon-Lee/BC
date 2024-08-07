// contracts/HealthData.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract HealthData {
    struct HealthScore {
        uint256 balanceScore;
        uint256 painScore;
    }

    mapping(address => HealthScore) public healthScores;

    event BalanceScoreSubmitted(address indexed user, uint256 balanceScore);
    event PainScoreSubmitted(address indexed user, uint256 painScore);

    function submitBalanceScore(uint256 balanceScore) public {
        require(balanceScore <= 56, "Balance score must be between 0 and 56");
        healthScores[msg.sender].balanceScore = balanceScore;
        emit BalanceScoreSubmitted(msg.sender, balanceScore);
    }

    function submitPainScore(uint256 painScore) public {
        require(painScore <= 10, "Pain score must be between 0 and 10");
        healthScores[msg.sender].painScore = painScore;
        emit PainScoreSubmitted(msg.sender, painScore);
    }

    function getHealthScores(address user) public view returns (uint256 balanceScore, uint256 painScore) {
        HealthScore memory scores = healthScores[user];
        return (scores.balanceScore, scores.painScore);
    }
}
