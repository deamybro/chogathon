// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

/**
 * @title ChogArcadeVault
 * @dev Secure Hackathon Bounty Vault for CHOGATHON Arcade on Monad.
 * Holds the 400 $CHOG reward pool and distributes capped micro-bounties to winning players.
 *
 * Security features:
 * 1. Owner-only emergency withdrawal (you can withdraw 100% of your remaining $CHOG at any time).
 * 2. Hard-capped maximum payout per game run (prevents vault drain exploits).
 * 3. Cryptographic signature verification (EIP-712 / ECDSA) to ensure only legitimate runs claim rewards.
 */
contract ChogArcadeVault {
    // The $CHOG ERC-20 token contract
    IERC20 public immutable chogToken;

    // The owner / deployer (you)
    address public owner;

    // Authorized signer for game run score vouchers
    address public gameSigner;

    // Hard ceiling for any single run bounty (e.g. 0.10 $CHOG = 0.10 * 10^18)
    uint256 public maxBountyPerRun;

    // Prevent replay attacks (voucher hash => claimed)
    mapping(bytes32 => bool) public executedVouchers;

    // Player lifetime claimed totals
    mapping(address => uint256) public playerTotalClaimed;

    event BountyClaimed(address indexed player, uint256 amount, bytes32 voucherHash, uint256 timestamp);
    event EmergencyWithdrawn(address indexed owner, uint256 amount, uint256 timestamp);
    event SignerUpdated(address indexed newSigner);
    event MaxBountyUpdated(uint256 newMaxBounty);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only vault owner");
        _;
    }

    /**
     * @param _chogToken Address of the $CHOG ERC-20 token on Monad
     */
    constructor(address _chogToken) {
        require(_chogToken != address(0), "Invalid token address");
        chogToken = IERC20(_chogToken);
        owner = msg.sender;
        gameSigner = msg.sender;
        maxBountyPerRun = 100000000000000000; // 0.10 $CHOG (18 decimals)
    }

    /**
     * @dev Claim run bounty with an authorized cryptographic voucher from the game engine.
     * The player signs and submits this transaction.
     */
    function claimRunBounty(
        uint256 amount,
        uint256 score,
        uint256 tokenId,
        uint256 nonce,
        bytes calldata signature
    ) external {
        require(amount <= maxBountyPerRun, "Exceeds max run bounty");
        require(chogToken.balanceOf(address(this)) >= amount, "Vault bounty pool empty");

        // Construct unique voucher hash
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                keccak256(abi.encodePacked(msg.sender, amount, score, tokenId, nonce, block.chainid, address(this)))
            )
        );

        require(!executedVouchers[messageHash], "Voucher already claimed");

        // Verify signature came from authorized game signer or owner
        address recoveredSigner = recoverSigner(messageHash, signature);
        require(recoveredSigner == gameSigner || recoveredSigner == owner, "Invalid game voucher signature");

        // Mark executed
        executedVouchers[messageHash] = true;
        playerTotalClaimed[msg.sender] += amount;

        // Transfer $CHOG to player
        require(chogToken.transfer(msg.sender, amount), "Token transfer failed");

        emit BountyClaimed(msg.sender, amount, messageHash, block.timestamp);
    }

    /**
     * @dev Direct owner payout fallback (for manual distributions or automated server dispensers)
     */
    function directPayout(address player, uint256 amount) external onlyOwner {
        require(amount <= maxBountyPerRun, "Exceeds max run bounty");
        require(chogToken.balanceOf(address(this)) >= amount, "Vault bounty pool empty");

        playerTotalClaimed[player] += amount;
        require(chogToken.transfer(player, amount), "Token transfer failed");

        emit BountyClaimed(player, amount, bytes32(0), block.timestamp);
    }

    /**
     * @dev Emergency withdraw: ONLY YOU can pull your tokens back to your personal wallet.
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = chogToken.balanceOf(address(this));
        require(balance > 0, "Vault has no tokens");
        require(chogToken.transfer(owner, balance), "Emergency transfer failed");
        emit EmergencyWithdrawn(owner, balance, block.timestamp);
    }

    /**
     * @dev Set authorized game signer
     */
    function setGameSigner(address _newSigner) external onlyOwner {
        require(_newSigner != address(0), "Invalid signer address");
        gameSigner = _newSigner;
        emit SignerUpdated(_newSigner);
    }

    /**
     * @dev Update max bounty ceiling
     */
    function setMaxBounty(uint256 _newMax) external onlyOwner {
        maxBountyPerRun = _newMax;
        emit MaxBountyUpdated(_newMax);
    }

    /**
     * @dev Transfer vault ownership
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid new owner");
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }

    /**
     * @dev Recover signer address from signature
     */
    function recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _sig) internal pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_sig);
        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function splitSignature(bytes memory sig) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "invalid signature length");

        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }

    /**
     * @dev Check remaining $CHOG balance in the vault
     */
    function getVaultBalance() external view returns (uint256) {
        return chogToken.balanceOf(address(this));
    }
}
