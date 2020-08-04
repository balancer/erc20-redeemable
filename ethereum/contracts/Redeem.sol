pragma solidity 0.6.0;

import "./IERC20.sol";
//contract Redeem is AbstractRedeem {

contract Redeem {

  IERC20 public token;
  address public owner;

  event Allocated(address _claimant, uint256 _week, uint256 _balance);
  event Claimed(address _claimant, uint256 _balance);


  // the outstanding balances for each user (by week)
  mapping(address => uint[]) public weeksWithBenefits;
  
  // Recorded weeks
  uint latestWeek;
  mapping(uint => uint) weekTimestamps;
  mapping(uint => bytes32) weekBlockHashes;

  // balances by [week][address]
  mapping(uint => mapping(address => uint)) balances;

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
    require(weekTimestamps[_week] != 0);
    require(weekBlockHashes[_week] != 0);
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


  function offsetRequirementMet(address user, uint _week) view public returns (bool){
      bytes32 blockHash = weekBlockHashes[_week];
      uint timestamp = weekTimestamps[_week];
      uint offsetSeconds = userWeekOffset(user, blockHash);

      uint earliestClaimableTimestamp = timestamp + (offsetSeconds);
      return earliestClaimableTimestamp < block.timestamp;
  }

  // claim has to be for a single week to prevent out of gas if someone were to wait too long to
  // retrieve their earnings
  function claimWeek(uint _week) public
  requireWeekInPast(_week)
  requireWeekRecorded(_week)
  {

    // if trying to claim for the current week
    if(_week == latestWeek) {
      require(offsetRequirementMet(msg.sender, latestWeek), "It is too early to claim for the current week");
    }
    uint bal = balances[_week][msg.sender];
    disburse(msg.sender, bal);
    delete balances[_week][msg.sender];
  }


  // attempt to claim all - if this is too much gas, fallback to claim function above
  function claim() public returns (bool)
  {
    uint totalBalance = 0;

    uint numClaimableWeeks;

    uint lastIndex = weeksWithBenefits[msg.sender].length - 1;

    bool disburseCurrentWeek = offsetRequirementMet(msg.sender, latestWeek);
    bool earnedThisWeek = (lastIndex >= 0) && weeksWithBenefits[msg.sender][lastIndex] != 0;

    bool payoutAll = disburseCurrentWeek || !earnedThisWeek;

    if (payoutAll){
      numClaimableWeeks = weeksWithBenefits[msg.sender].length;
    } else if (latestWeek != 0) {
      numClaimableWeeks = weeksWithBenefits[msg.sender].length - 1;
    }
      

    for(uint i = 0; i < numClaimableWeeks; i++) {
      uint week = weeksWithBenefits[msg.sender][i];
      totalBalance += balances[week][msg.sender];
      delete balances[week][msg.sender];
    }
    disburse(msg.sender, totalBalance);

    if (payoutAll) {
      delete weeksWithBenefits[msg.sender];
    } else if (latestWeek != 0) {
      weeksWithBenefits[msg.sender] = [latestWeek];
    }
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
    weekTimestamps[_week] = _timestamp;
    weekBlockHashes[_week] = _blockHash;
    if (_week > latestWeek) { // just in case we get these out of order
      latestWeek = _week;
    }
  }

  function getAllocation(uint _week, address _liquidityProvider) view public returns (uint) {
    return balances[_week][_liquidityProvider];
  }

  function seedAllocations(uint _week, address[] calldata _liquidityProviders, uint[] calldata _balances) external
  requireWeekRecorded(_week)
  onlyOwner
  {
    require(_liquidityProviders.length == _balances.length, "must be an equal number of liquidityProviders and balances");

    for(uint i = 0; i < _liquidityProviders.length; i += 1) {
      // record their balance for the week
      balances[_week][_liquidityProviders[i]] = _balances[i];
      weeksWithBenefits[_liquidityProviders[i]].push(_week);

      emit Allocated(_liquidityProviders[i], _week, _balances[i]);
    }
  }

  function seedAllocation(uint _week, address _liquidityProvider, uint _bal) external
  requireWeekRecorded(_week)
  onlyOwner
  {
    balances[_week][_liquidityProvider] = _bal;
    weeksWithBenefits[_liquidityProvider].push(_week);

    emit Allocated(_liquidityProvider, _week, _bal);
  }

}
