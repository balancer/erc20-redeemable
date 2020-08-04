let Redeem = artifacts.require('./Redeem.sol')

contract('Redeem', (accounts) => {
  let redeem
  // these are deterministic because accounts are deterministic for the ganache mnemonic
  const endingBlockHash = '0x76e2419510611ed9dceb203644e997aae76fb195d6420f8bee64368b14303312' 
  const expectedDays = [4, 4, 5, 1, 1, 4, 4, 5, 5, 3]

  beforeEach(async () => {
    redeem = await Redeem.new()
  })

  it('correctly generates days of the week', async () => {
    let day

    for (var i = 0; i < 10; i++) {
      day = await redeem.calculateDay(accounts[i], endingBlockHash)
      assert(day == expectedDays[i], 'day should be ' + expectedDays[i])
    }
  })

  it('stores an allocation', async () => {
    const lastBlock = await web3.eth.getBlock('latest')

    await redeem.finishWeek(1, lastBlock.timestamp, lastBlock.hash)
    await redeem.seedAllocation(1, accounts[0], 1000)

    let result = await redeem.getAllocation(1, accounts[0])
    assert(result == 1000, 'user should have an allocation')
  })

  it('stores multiple allocations', async () => {
    const lastBlock = await web3.eth.getBlock('latest')

    await redeem.finishWeek(1, lastBlock.timestamp, lastBlock.hash)

    await redeem.seedAllocations(1, [accounts[0], accounts[1]], [1000, 2000])

    let result = await redeem.getAllocation(1, accounts[0])
    assert(result == 1000, 'account 0 should have an allocation')

    result = await redeem.getAllocation(1, accounts[1])
    assert(result == 2000, 'account 1 should have an allocation')
  })


})
