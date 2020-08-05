const TToken = artifacts.require("./TToken.sol");
const Redeem = artifacts.require("./MerkleRedeem.sol");
const should = require("chai").should();
const { utils, eth } = web3;
const { MerkleTree } = require("../lib/merkleTree");
const { soliditySha3 } = require("web3-utils");

contract("MerkleRedeem - High Volume", accounts => {
  const admin = accounts[0];

  let redeem;
  let REDEEM;

  let tbal;
  let TBAL;

  const TEST_QUANTITY = 200;

  beforeEach(async () => {
    tbal = await TToken.new("Test Bal", "TBAL", 18);
    await tbal.mint(admin, utils.toWei("145000"));
    TBAL = tbal.address;

    redeem = await Redeem.new(TBAL);
    REDEEM = redeem.address;
    await tbal.transfer(REDEEM, utils.toWei("20000"));
  });

  it("stores " + TEST_QUANTITY + " allocations", async () => {
    const lastBlock = await web3.eth.getBlock("latest");

    await redeem.finishWeek(1, lastBlock.timestamp, lastBlock.hash);

    let addresses = [...Array(TEST_QUANTITY).keys()].map(
      num => eth.accounts.create().address
    );

    const elements = addresses.map((address, num) =>
      soliditySha3(address, utils.toWei((num * 10).toString()))
    );
    const merkleTree = new MerkleTree(elements);
    const root = merkleTree.getHexRoot();

    await redeem.seedAllocations(1, root);

    const proof36 = merkleTree.getHexProof(elements[36]);
    let result = await redeem.verifyClaim(
      addresses[36],
      1,
      utils.toWei("360"),
      proof36
    );
    assert(result, "account 36 should have an allocation");

    const proof48 = merkleTree.getHexProof(elements[48]);
    result = await redeem.verifyClaim(
      addresses[48],
      1,
      utils.toWei("480"),
      proof48
    );
    assert(result, "account 48 should have an allocation");
  });
});
