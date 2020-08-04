const TToken = artifacts.require("./TToken.sol");
const Redeem = artifacts.require("./Redeem.sol");
const should = require("chai").should();
const { utils, eth } = web3;

contract("Redeem - High Volume", accounts => {
  const admin = accounts[0];

  let redeem;
  let REDEEM;

  let tbal;
  let TBAL;

  beforeEach(async () => {
    tbal = await TToken.new("Test Bal", "TBAL", 18);
    await tbal.mint(admin, utils.toWei("145000"));
    TBAL = tbal.address;

    redeem = await Redeem.new(TBAL);
    REDEEM = redeem.address;
    await tbal.transfer(REDEEM, utils.toWei("20000"));
  });

  it("stores 100 allocations", async () => {
    const lastBlock = await web3.eth.getBlock("latest");

    await redeem.finishWeek(1, lastBlock.timestamp, lastBlock.hash);

    let addresses = [...Array(100).keys()].map(
      num => eth.accounts.create().address
    );
    let balances = [...Array(100).keys()].map(num =>
      utils.toWei((num * 10).toString())
    );

    await redeem.seedAllocations(1, addresses, balances);

    //let result = await redeem.getAllocation(1, addresses[36]);
    let result = await redeem.balanceOf(addresses[36]);
    assert(
      result == utils.toWei("360"),
      "account 36 should have an allocation"
    );

    //result = await redeem.getAllocation(1, addresses[48]);
    result = await redeem.balanceOf(addresses[48]);
    assert(
      result == utils.toWei("480"),
      "account 48 should have an allocation"
    );
  });
});
