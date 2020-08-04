const TToken = artifacts.require("./TToken.sol");
const Redeem = artifacts.require("./Redeem.sol");
const should = require("chai").should();
const { promisify } = require("util");
const { utils } = web3;

async function assertRevert(promise) {
  try {
    await promise;
  } catch (error) {
    error.message.should.include(
      "revert",
      `Expected "revert()", got ${error} instead`
    );
    return;
  }
  should.fail('Expected "revert()"');
}

contract("Redeem", accounts => {
  const admin = accounts[0];

  let redeem;
  let REDEEM;

  let tbal;
  let TBAL;
  // these are deterministic because accounts are deterministic for the ganache mnemonic
  const endingBlockHash =
    "0x76e2419510611ed9dceb203644e997aae76fb195d6420f8bee64368b14303312";
  const expectedOffsetSeconds = [
    581200,
    171952,
    63845,
    503077,
    284922,
    44468,
    25715,
    559291,
    98173,
    588157
  ];

  beforeEach(async () => {
    tbal = await TToken.new("Test Bal", "TBAL", 18);
    await tbal.mint(admin, utils.toWei("145000"));
    TBAL = tbal.address;

    redeem = await Redeem.new(TBAL);
    REDEEM = redeem.address;
    await tbal.transfer(REDEEM, utils.toWei("20000"));
  });

  it("correctly generates offsets for each user", async () => {
    let offsetSeconds;

    for (var i = 0; i < 10; i++) {
      offsetSeconds = await redeem.userWeekOffset(accounts[i], endingBlockHash);
      assert(
        offsetSeconds == expectedOffsetSeconds[i],
        "offset should be " + expectedOffsetSeconds[i] + " seconds"
      );
    }
  });

  it("stores an allocation", async () => {
    const lastBlock = await web3.eth.getBlock("latest");

    await redeem.finishWeek(1, lastBlock.timestamp, lastBlock.hash);
    await redeem.seedAllocation(1, accounts[0], utils.toWei("1000"));

    //let result = await redeem.getAllocation(1, accounts[0]);
    let result = await redeem.balanceOf(accounts[0]);
    assert(result == utils.toWei("1000"), "user should have an allocation");
  });

  it("stores multiple allocations", async () => {
    const lastBlock = await web3.eth.getBlock("latest");

    await redeem.finishWeek(1, lastBlock.timestamp, lastBlock.hash);

    await redeem.seedAllocations(
      1,
      [accounts[0], accounts[1]],
      [utils.toWei("1000"), utils.toWei("2000")]
    );

    //let result = await redeem.getAllocation(1, accounts[0]);
    let result = await redeem.balanceOf(accounts[0]);
    assert(
      result == utils.toWei("1000"),
      "account 0 should have an allocation"
    );

    //result = await redeem.getAllocation(1, accounts[1]);
    result = await redeem.balanceOf(accounts[1]);
    assert(
      result == utils.toWei("2000"),
      "account 1 should have an allocation"
    );
  });

  const increaseTime = async days => {
    await promisify(web3.currentProvider.send)({
      jsonrpc: "2.0",
      method: "evm_increaseTime",
      params: [days * 24 * 3600 + 1], // 1 extra second
      id: 0
    });

    await promisify(web3.currentProvider.send)({
      jsonrpc: "2.0",
      method: "evm_mine",
      params: [],
      id: new Date().getSeconds()
    });
  };

  describe("When a user has an allocation to claim", () => {
    beforeEach(async () => {
      const lastBlock = await web3.eth.getBlock("latest");

      let lastBlockHash =
        "0x7c1b1e7c2eaddafdf52250cba9679e5b30014a9d86a0e2af17ec4cee24a5fc80";
      await redeem.finishWeek(1, lastBlock.timestamp, lastBlockHash);
      await redeem.seedAllocation(1, accounts[1], utils.toWei("1000"));

      //let result = await redeem.getAllocation(1, accounts[1], {
      let result = await redeem.balanceOf(accounts[1], {
        from: accounts[1]
      });
      assert(result == utils.toWei("1000"), "user should have an allocation");
    });

    it("Allows the user to claim once time has passed", async () => {
      await increaseTime(5); // needs to be 1 days minimum
      await redeem.claim({ from: accounts[1] });

      let result = await tbal.balanceOf(accounts[1]);
      assert(result == utils.toWei("1000"), "user should have an allocation");
    });

    it("Reverts when the user attempts to claim prematurely", async () => {
      await increaseTime(0);
      await assertRevert(redeem.claim({ from: accounts[1] }));
    });
  });

  describe("When a user has several allocation to claim", () => {
    beforeEach(async () => {
      let lastBlock = await web3.eth.getBlock("latest");

      await redeem.finishWeek(1, lastBlock.timestamp, lastBlock.hash);
      await redeem.seedAllocation(1, accounts[1], utils.toWei("1000"));

      await increaseTime(7);
      lastBlock = await web3.eth.getBlock("latest");
      let lastBlockHash =
        "0xb6801f31f93d990dfe65d67d3479c3853d5fafd7a7f2b8fad9e68084d8d409e0"; // set this manually to simplify testing
      await redeem.finishWeek(2, lastBlock.timestamp, lastBlockHash);
      await redeem.seedAllocation(2, accounts[1], utils.toWei("1234"));
    });

    it("Allows the user to claim once the time has past", async () => {
      await increaseTime(8);
      await redeem.claim({ from: accounts[1] });

      let result = await tbal.balanceOf(accounts[1]);
      assert(
        result == utils.toWei("2234"),
        "user should receive all tokens, including current week"
      );
    });

    it("Allows the user to claim past weeks if current week ineligible", async () => {
      await increaseTime(0);
      await redeem.claim({ from: accounts[1] });

      let result = await tbal.balanceOf(accounts[1]);
      assert(
        result == utils.toWei("1000"),
        "user should only receive past weeks"
      );
    });
  });
});
