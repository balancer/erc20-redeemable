const TToken = artifacts.require("./TToken.sol");
const Redeem = artifacts.require("./MerkleRedeem.sol");
const should = require("chai").should();
const { promisify } = require("util");
const { utils } = web3;
const { MerkleTree } = require("../lib/merkleTree");
const { increaseTime } = require("./helpers");

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

contract("MerkleRedeem", accounts => {
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
    let claimBalance = utils.toWei("9876");
    const lastBlock = await web3.eth.getBlock("latest");

    await redeem.finishWeek(1, lastBlock.timestamp, lastBlock.hash);

    const elements = [utils.soliditySha3(accounts[0], claimBalance)];
    const merkleTree = new MerkleTree(elements);
    const root = merkleTree.getHexRoot();

    await redeem.seedAllocations(1, root);

    const proof = merkleTree.getHexProof(elements[0]);

    let result = await redeem.verifyClaim(accounts[0], 1, claimBalance, proof);
    assert(result, "user should have an allocation");
  });

  it("doesn't allow an allocation to be overwritten", async () => {
    let claimBalance = utils.toWei("9876");
    const lastBlock = await web3.eth.getBlock("latest");

    await redeem.finishWeek(1, lastBlock.timestamp, lastBlock.hash);

    const elements = [utils.soliditySha3(accounts[0], claimBalance)];
    const merkleTree = new MerkleTree(elements);
    const root = merkleTree.getHexRoot();

    await redeem.seedAllocations(1, root);

    // construct tree to attempt to override the allocation
    const elements2 = [
      utils.soliditySha3(accounts[0], claimBalance),
      utils.soliditySha3(accounts[1], claimBalance)
    ];
    const merkleTree2 = new MerkleTree(elements);
    const root2 = merkleTree.getHexRoot();

    await assertRevert(redeem.seedAllocations(1, root2));
  });

  it("stores multiple allocations", async () => {
    const lastBlock = await web3.eth.getBlock("latest");

    await redeem.finishWeek(1, lastBlock.timestamp, lastBlock.hash);

    let claimBalance0 = utils.toWei("1000");
    let claimBalance1 = utils.toWei("2000");

    const elements = [
      utils.soliditySha3(accounts[0], claimBalance0),
      utils.soliditySha3(accounts[1], claimBalance1)
    ];
    const merkleTree = new MerkleTree(elements);
    const root = merkleTree.getHexRoot();

    await redeem.seedAllocations(1, root);

    let proof0 = merkleTree.getHexProof(elements[0]);
    let result = await redeem.verifyClaim(
      accounts[0],
      1,
      claimBalance0,
      proof0
    );
    assert(result, "account 0 should have an allocation");

    let proof1 = merkleTree.getHexProof(elements[1]);
    result = await redeem.verifyClaim(accounts[1], 1, claimBalance1, proof1);
    assert(result, "account 1 should have an allocation");
  });

  describe("With a week finished", () => {
    const claimBalance = utils.toWei("1000");
    const elements = [utils.soliditySha3(accounts[1], claimBalance)];
    const merkleTree = new MerkleTree(elements);
    //const root = merkleTree.getHexRoot();

    beforeEach(async () => {
      const lastBlock = await web3.eth.getBlock("latest");
      await redeem.finishWeek(1, lastBlock.timestamp, lastBlock.hash);
    });

    it("Reverts when the user attempts to claim before an allocation is produced", async () => {
      await increaseTime(9);
      let claimedBalance = utils.toWei("1000");

      const merkleProof = merkleTree.getHexProof(elements[0]);
      await assertRevert(
        redeem.claimWeek(1, claimedBalance, merkleProof, { from: accounts[1] })
      );
    });
  });

  describe("When a user has an allocation to claim", () => {
    const claimBalance = utils.toWei("1000");
    const elements = [utils.soliditySha3(accounts[1], claimBalance)];
    const merkleTree = new MerkleTree(elements);
    const root = merkleTree.getHexRoot();

    beforeEach(async () => {
      const lastBlock = await web3.eth.getBlock("latest");

      let lastBlockHash =
        "0x7c1b1e7c2eaddafdf52250cba9679e5b30014a9d86a0e2af17ec4cee24a5fc80";
      await redeem.finishWeek(1, lastBlock.timestamp, lastBlockHash);

      await redeem.seedAllocations(1, root);
    });

    it("Allows the user to claimWeek once time has passed", async () => {
      await increaseTime(6);
      let claimedBalance = utils.toWei("1000");
      const merkleProof = merkleTree.getHexProof(elements[0]);
      await redeem.claimWeek(1, claimedBalance, merkleProof, {
        from: accounts[1]
      });

      let result = await tbal.balanceOf(accounts[1]);
      assert(result == claimedBalance, "user should have an allocation");
    });

    it("Reverts when the user attempts to claim prematurely", async () => {
      await increaseTime(0);
      let claimedBalance = utils.toWei("1000");
      const merkleProof = merkleTree.getHexProof(elements[0]);
      await assertRevert(
        redeem.claimWeek(1, claimedBalance, merkleProof, { from: accounts[1] })
      );
    });

    it("Doesn't allow a user to claim for another user", async () => {
      await increaseTime(6);
      let claimedBalance = utils.toWei("1000");
      const merkleProof = merkleTree.getHexProof(elements[0]);

      await assertRevert(
        redeem.claimWeek(1, claimedBalance, merkleProof, { from: accounts[2] })
      );
    });

    it("Reverts when the user attempts to claim the wrong balance", async () => {
      await increaseTime(0);
      let claimedBalance = utils.toWei("666");
      const merkleProof = merkleTree.getHexProof(elements[0]);
      await assertRevert(
        redeem.claimWeek(1, claimedBalance, merkleProof, { from: accounts[1] })
      );
    });

    it("Reverts when the user attempts to claim twice", async () => {
      await increaseTime(6);
      let claimedBalance = utils.toWei("1000");
      const merkleProof = merkleTree.getHexProof(elements[0]);

      await redeem.claimWeek(1, claimedBalance, merkleProof, {
        from: accounts[1]
      });

      await assertRevert(
        redeem.claimWeek(1, claimedBalance, merkleProof, { from: accounts[1] })
      );
    });
  });

  describe("When a user has several allocation to claim", () => {
    const claimBalance1 = utils.toWei("1000");
    const elements1 = [utils.soliditySha3(accounts[1], claimBalance1)];
    const merkleTree1 = new MerkleTree(elements1);
    const root1 = merkleTree1.getHexRoot();

    const claimBalance2 = utils.toWei("1234");
    const elements2 = [utils.soliditySha3(accounts[1], claimBalance2)];
    const merkleTree2 = new MerkleTree(elements2);
    const root2 = merkleTree2.getHexRoot();

    beforeEach(async () => {
      let lastBlock = await web3.eth.getBlock("latest");

      await redeem.finishWeek(1, lastBlock.timestamp, lastBlock.hash);
      await redeem.seedAllocations(1, root1);

      await increaseTime(7);
      lastBlock = await web3.eth.getBlock("latest");
      let lastBlockHash =
        "0xb6801f31f93d990dfe65d67d3479c3853d5fafd7a7f2b8fad9e68084d8d409e0"; // set this manually to simplify testing
      await redeem.finishWeek(2, lastBlock.timestamp, lastBlockHash);
      await redeem.seedAllocations(2, root2);
    });

    it("Allows the user to claim once the time has past", async () => {
      await increaseTime(8);

      let claimedBalance1 = utils.toWei("1000");
      let claimedBalance2 = utils.toWei("1234");

      const proof1 = merkleTree1.getHexProof(elements1[0]);
      await redeem.claimWeek(1, claimedBalance1, proof1, { from: accounts[1] });

      const proof2 = merkleTree2.getHexProof(elements2[0]);
      await redeem.claimWeek(2, claimedBalance2, proof2, { from: accounts[1] });

      let result = await tbal.balanceOf(accounts[1]);
      assert(
        result == utils.toWei("2234"),
        "user should receive all tokens, including current week"
      );
    });

    it("Allows the user to claim multiple weeks at once", async () => {
      await increaseTime(8);

      let claimedBalance1 = utils.toWei("1000");
      let claimedBalance2 = utils.toWei("1234");

      const proof1 = merkleTree1.getHexProof(elements1[0]);
      const proof2 = merkleTree2.getHexProof(elements2[0]);

      await redeem.claimWeeks(
        [[1, claimedBalance1, proof1], [2, claimedBalance2, proof2]],
        { from: accounts[1] }
      );

      let result = await tbal.balanceOf(accounts[1]);
      assert(
        result == utils.toWei("2234"),
        "user should receive all tokens, including current week"
      );
    });
  });
});
