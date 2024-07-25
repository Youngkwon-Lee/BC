// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MyNFT is ERC721, ERC721Burnable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct RewardInfo {
        uint256 steps;
        uint256 lastClaimedDate;
    }

    mapping(address => RewardInfo) public rewards;
    mapping(uint256 => string) public ticketTypes;
    mapping(address => uint256) public nftBalances;

    address public fitnessCenterAddress;

    constructor(address _fitnessCenterAddress) ERC721("MyNFT", "MNFT") {
        fitnessCenterAddress = _fitnessCenterAddress;
    }

    function mintNFT(address recipient, string memory ticketType) private returns (uint256) {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(recipient, newItemId);
        ticketTypes[newItemId] = ticketType;
        nftBalances[recipient] += 1;
        return newItemId;
    }

    function setReward(address user, uint256 steps) public {
        require(steps >= 3000, "Not enough steps to earn a reward");
        rewards[user].steps = steps;
    }

    function claimReward(string memory ticketType) public {
        uint256 currentDate = block.timestamp / 1 days;
        require(rewards[msg.sender].steps >= 3000, "Not enough steps to claim a reward");
        require(rewards[msg.sender].lastClaimedDate < currentDate, "Reward already claimed for today");

        rewards[msg.sender].steps = 0;
        rewards[msg.sender].lastClaimedDate = currentDate;
        mintNFT(msg.sender, ticketType);
    }

    function getTotalNFTs() public view returns (uint256) {
        return _tokenIds.current();
    }

    function exchangeNFTsForTicket(uint256[] memory tokenIds, string memory ticketType) public {
        require(tokenIds.length == 100, "You need exactly 100 NFTs to exchange for a ticket");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(ownerOf(tokenIds[i]) == msg.sender, "You do not own this NFT");
            burn(tokenIds[i]);
            nftBalances[msg.sender] -= 1;
        }

        // 티켓을 발급하는 로직
        emit TicketIssued(msg.sender, ticketType);
    }

    function transferNFTToFitnessCenter(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "You do not own this NFT");
        require(keccak256(abi.encodePacked(ticketTypes[tokenId])) == keccak256(abi.encodePacked("Fitness Center 1-day Pass")), "Not a valid fitness center ticket");
        safeTransferFrom(msg.sender, fitnessCenterAddress, tokenId);
        emit NFTTransferredToFitnessCenter(msg.sender, tokenId);
    }

    event TicketIssued(address indexed user, string ticketType);
    event NFTTransferredToFitnessCenter(address indexed user, uint256 tokenId);
}
