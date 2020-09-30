pragma solidity 0.6.8;
pragma experimental ABIEncoderV2;

library MerkleProof {
    /**
     * @dev Returns true if a `leaf` can be proved to be a part of a Merkle tree
     * defined by `root`. For this, a `proof` must be provided, containing
     * sibling hashes on the branch from the leaf to the root of the tree. Each
     * pair of leaves and each pair of pre-images are assumed to be sorted.
     */
    function verify(bytes32[] memory proof, bytes32 root, bytes32 leaf) internal pure returns (bool) {
        bytes32 computedHash = leaf;

        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];

            if (computedHash <= proofElement) {
                // Hash(current computed hash + current element of the proof)
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                // Hash(current element of the proof + current computed hash)
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }

        // Check if the computed hash (root) is equal to the provided root
        return computedHash == root;
    }
}

import "./IERC20.sol";

contract MerkleRedeem {

    IERC20 public token;
    address public owner;

    event Claimed(address _claimant, uint256 _balance);

    // Recorded weeks
    mapping(uint => bytes32) public weekMerkleRoots;
    mapping(uint => mapping(address => bool)) public claimed;

    constructor(
        address _token
    ) public {
        token = IERC20(_token);
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Must be the contract owner");
        _;
    }

    function disburse(
        address _liquidityProvider,
        uint _balance
    )
        private
    {
        if (_balance > 0) {
            emit Claimed(_liquidityProvider, _balance);
            require(token.transfer(_liquidityProvider, _balance), "ERR_TRANSFER_FAILED");
        }
    }

    function claimWeek(
        address _liquidityProvider,
        uint _week,
        uint _claimedBalance,
        bytes32[] memory _merkleProof
    )
        public
    {
        require(!claimed[_week][_liquidityProvider]);
        require(verifyClaim(_liquidityProvider, _week, _claimedBalance, _merkleProof), 'Incorrect merkle proof');

        claimed[_week][_liquidityProvider] = true;
        disburse(_liquidityProvider, _claimedBalance);
    }

    struct Claim {
        uint week;
        uint balance;
        bytes32[] merkleProof;
    }

    function claimWeeks(
        address _liquidityProvider,
        Claim[] memory claims
    )
        public
    {
        uint totalBalance = 0;
        Claim memory claim ;
        for(uint i = 0; i < claims.length; i++) {
            claim = claims[i];

            require(!claimed[claim.week][_liquidityProvider]);
            require(verifyClaim(_liquidityProvider, claim.week, claim.balance, claim.merkleProof), 'Incorrect merkle proof');

            totalBalance += claim.balance;
            claimed[claim.week][_liquidityProvider] = true;
        }
        disburse(_liquidityProvider, totalBalance);
    }

    function claimStatus(
        address _liquidityProvider,
        uint _begin,
        uint _end
    )
        external
        view
        returns (bool[] memory)
    {
        uint size = 1 + _end - _begin;
        bool[] memory arr = new bool[](size);
        for(uint i = 0; i < size; i++) {
            arr[i] = claimed[_begin + i][_liquidityProvider];
        }
        return arr;
    }

    function merkleRoots(
        uint _begin,
        uint _end
    ) 
        external
        view 
        returns (bytes32[] memory)
    {
        uint size = 1 + _end - _begin;
        bytes32[] memory arr = new bytes32[](size);
        for(uint i = 0; i < size; i++) {
            arr[i] = weekMerkleRoots[_begin + i];
        }
        return arr;
    }

    function verifyClaim(
        address _liquidityProvider,
        uint _week,
        uint _claimedBalance,
        bytes32[] memory _merkleProof
    )
        public
        view
        returns (bool valid)
    {
        bytes32 leaf = keccak256(abi.encodePacked(_liquidityProvider, _claimedBalance));
        return MerkleProof.verify(_merkleProof, weekMerkleRoots[_week], leaf);
    }

    function seedAllocations(
        uint _week,
        bytes32 _merkleRoot,
        uint _totalAllocation
    )
        external
        onlyOwner
    {
        require(weekMerkleRoots[_week] == bytes32(0), "cannot rewrite merkle root");
        weekMerkleRoots[_week] = _merkleRoot;

        require(token.transferFrom(msg.sender, address(this), _totalAllocation), "ERR_TRANSFER_FAILED");
    }
}
