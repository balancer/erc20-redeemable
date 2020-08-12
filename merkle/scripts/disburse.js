// Usage example:
// npm run disburse -- /home/greg/erc20-redeemable/merkle/test/10_totals.json 10622281

const { MerkleTree } = require("../lib/merkleTree");
const { utils } = web3;
const { loadTree } = require("./loadTree");
const fs = require("fs");

module.exports = async function(callback) {
  console.log("File Path Arg (must be absolute):", process.argv[4]);

  const merkleTree = loadTree(utils, process.argv[4]);
  const blockNum = process.argv[5];

  const block = await web3.eth.getBlock(blockNum);
  console.log("Block:\t", blockNum, block.hash, block.timestamp);

  const root = merkleTree.getHexRoot();
  console.log("Tree:\t", root);

  console.log("\n\n// TO FINISH THIS WEEK");
  console.log("let redeem\nMerkleRedeem.deployed().then(i => redeem = i);");
  console.log("let weekNum = 1 // adjust accordingly");
  console.log(
    "await redeem.finishWeek(weekNum, " +
      block.timestamp +
      ', "' +
      block.hash +
      '")'
  );
  console.log('await redeem.seedAllocations(weekNum, "' + root + '")');
};
