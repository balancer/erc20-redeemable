pragma solidity 0.6.0;

import "./IERC20.sol";

contract Redeem {

  IERC20 public token;
  address public owner;

  event Allocated(address _claimant, uint256 _week, uint256 _balance);
  event Claimed(address _claimant, uint256 _balance);

  // the outstanding balances for each user (by week)
  mapping(address => uint[]) public weeksWithBenefits;
  
  // Recorded weeks
  uint latestWeek;
  uint latestWeekTimestamp;
  bytes32 latestWeekBlockHash;

  mapping(address => uint) vestedBalances;
  mapping(address => uint) pendingBalances;
  address[] usersWithPendingBalances;

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

  modifier requireWeekInPast(uint week) {
    require(week <= latestWeek, "Week cannot be in the future");
    _;
  }

  modifier requireWeekRecorded(uint _week) {
    require(latestWeek != 0);
    require(latestWeekBlockHash != 0);
    _;
  }

  function disburse(address _liquidityProvider, uint _balance) private {
    if (_balance > 0) {
      token.transfer(_liquidityProvider, _balance);
      emit Claimed(_liquidityProvider, _balance);
    } else {
      revert('No balance would be transfered');
    }
  }


  function offsetRequirementMet(address user) view public returns (bool){
      uint offsetSeconds = userWeekOffset(user, latestWeekBlockHash);

      uint earliestClaimableTimestamp = latestWeekTimestamp + offsetSeconds;
      return earliestClaimableTimestamp < block.timestamp;
  }

  // attempt to claim all - if this is too much gas, fallback to claim function above
  function claim() public returns (bool)
  {
    uint balance = vestedBalances[msg.sender];
    delete vestedBalances[msg.sender];

    bool disburseCurrentWeek = offsetRequirementMet(msg.sender);
    if (disburseCurrentWeek) {
      balance += pendingBalances[msg.sender];
      delete pendingBalances[msg.sender];
    }

    disburse(msg.sender, balance);
  }

  function userWeekOffset(address _liquidityProvider, bytes32 _weekBlockHash) pure public returns (uint offset) {
    bytes32 hash = keccak256(abi.encodePacked(_liquidityProvider, _weekBlockHash));
    assembly {
      offset :=
        mod(
          hash,
          604800 // seconds in a week
        )
    }
    return offset;
  }


  function finishWeek(uint _week, uint _timestamp, bytes32 _blockHash) public
  onlyOwner
  {
    if (_week > latestWeek) { // just in case we get these out of order
      latestWeekTimestamp = _timestamp;
      latestWeekBlockHash = _blockHash;

      latestWeek = _week;

      address lp;
      for(uint i = 0; i < usersWithPendingBalances.length; i += 1) {
        lp = usersWithPendingBalances[i];
        vestedBalances[lp] += pendingBalances[lp];
        delete pendingBalances[lp];
      }
      delete usersWithPendingBalances;
    }
  }

  function balanceOf(address _liquidityProvider) external view returns (uint) {
    return pendingBalances[_liquidityProvider] + vestedBalances[_liquidityProvider];
  }

  function seedAllocations(uint _week, address[] calldata _liquidityProviders, uint[] calldata _balances) external
  requireWeekRecorded(_week)
  onlyOwner
  {
    require(_liquidityProviders.length == _balances.length, "must be an equal number of liquidityProviders and balances");

    address lp;
    for(uint i = 0; i < _liquidityProviders.length; i += 1) {
      lp = _liquidityProviders[i];
      pendingBalances[lp] = _balances[i];

      emit Allocated(lp, _week, _balances[i]);
    }
    usersWithPendingBalances = _liquidityProviders;
  }

  function seedAllocation(uint _week, address _liquidityProvider, uint _bal) external
  requireWeekRecorded(_week)
  onlyOwner
  {
    pendingBalances[_liquidityProvider] = _bal;
    usersWithPendingBalances.push(_liquidityProvider);

    emit Allocated(_liquidityProvider, _week, _bal);
  }

}
