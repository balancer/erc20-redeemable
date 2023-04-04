pragma solidity 0.6.8;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MerkleRedeem is Ownable {

    //IERC20 public token;

    event Claimed(address _erc20, address _claimant, uint256 _balance);

    // Recorded weeks
    // token => week => user
    mapping(address => mapping(uint => bytes32)) public weekMerkleRoots;
    // token => week => user
    mapping(address => mapping(uint => mapping(address => bool))) public claimed;

    constructor(
        address[] memory _tokens
    ) public {
      // TODO - put these in a set and add a modifier to check token is in contract
        //token = IERC20(_token);
    }

    function disburse(
        address _erc20,
        address _user,
        uint _balance
    )
        private
    {
        IERC20 token = IERC20(_erc20);
        if (_balance > 0) {
            emit Claimed(_erc20, _user, _balance);
            require(token.transfer(_user, _balance), "ERR_TRANSFER_FAILED");
        }
    }

    // you can trigger a claim for another user
    function claimWeek(
        address _user,
        address _erc20,
        uint _week,
        uint _claimedBalance,
        bytes32[] memory _merkleProof
    )
        public
    {
        require(!claimed[_erc20][_week][_user]);
        require(verifyClaim(_user, _erc20, _week, _claimedBalance, _merkleProof), 'Incorrect merkle proof');

        claimed[_erc20][_week][_user] = true;
        disburse(_erc20, _user, _claimedBalance);
    }

    struct Claim {
        uint week;
        uint balance;
        bytes32[] merkleProof;
    }

    function claimWeeks(
        address _user,
        address _erc20,
        Claim[] memory claims
    )
        public
    {
        uint totalBalance = 0;
        Claim memory claim ;
        for(uint i = 0; i < claims.length; i++) {
            claim = claims[i];

            require(!claimed[_erc20][claim.week][_user]);
            require(verifyClaim(_user,_erc20,  claim.week, claim.balance, claim.merkleProof), 'Incorrect merkle proof');

            totalBalance += claim.balance;
            claimed[_erc20][claim.week][_user] = true;
        }
        disburse(_erc20, _user, totalBalance);
    }

    function claimStatus(
        address _user,
        address _erc20,
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
            arr[i] = claimed[_erc20][_begin + i][_user];
        }
        return arr;
    }

    function merkleRoots(
        address _erc20,
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
            arr[i] = weekMerkleRoots[_erc20][_begin + i];
        }
        return arr;
    }

    function verifyClaim(
        address _user,
        address _erc20,
        uint _week,
        uint _claimedBalance,
        bytes32[] memory _merkleProof
    )
        public
        view
        returns (bool valid)
    {
        bytes32 leaf = keccak256(abi.encodePacked(_user, _claimedBalance));
        return MerkleProof.verify(_merkleProof, weekMerkleRoots[_erc20][_week], leaf);
    }

    function seedAllocations(
        address _erc20,
        uint _week,
        bytes32 _merkleRoot,
        uint _totalAllocation
    )
        external
        onlyOwner
    {
        require(weekMerkleRoots[_erc20][_week] == bytes32(0), "cannot rewrite merkle root");
        weekMerkleRoots[_erc20][_week] = _merkleRoot;

        IERC20 token = IERC20(_erc20);
        require(token.transferFrom(msg.sender, address(this), _totalAllocation), "ERR_TRANSFER_FAILED");
    }
}
