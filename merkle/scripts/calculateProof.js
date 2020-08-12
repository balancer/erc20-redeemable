// Usage example:
// npm run calculateProof -- /home/greg/erc20-redeemable/merkle/test/10_totals.json  0x77c845E6A61F37cB7B237de90a74fbc3679FcF06

const { MerkleTree } = require("../lib/merkleTree");
const { utils } = web3;
const fs = require("fs");
const { loadTree } = require("./loadTree");

module.exports = function(callback) {
  console.log("File Path Arg (must be absolute):", process.argv[4]);

  const merkleTree = loadTree(utils, process.argv[4]);
  const root = merkleTree.getHexRoot();

  const rawdata = fs.readFileSync(process.argv[4]);
  const balances = JSON.parse(rawdata);
  const address = process.argv[5];

  const claimBalance = balances[address];
  console.log("Tree:\t", root);
  console.log("Account:\t", address);
  console.log("Balance:\t", claimBalance);
  const proof = merkleTree.getHexProof(
    utils.soliditySha3(address, utils.toWei(claimBalance))
  );
  console.log("Proof:\t", proof);

  console.log("\n\n// TO CLAIM THIS WEEK");
  console.log("let redeem\nMerkleRedeem.deployed().then(i => redeem = i);");
  console.log("\nlet weekNum = 1 // adjust accordingly");
  console.log("\nlet proof = " + JSON.stringify(proof));
  console.log('\nlet claimBalance = web3.utils.toWei("' + claimBalance + '")');

  console.log(
    '\nawait redeem.verifyClaim("' +
      address +
      '", weekNum, claimBalance, proof)'
  );
  console.log(
    '\nawait redeem.claimWeek("' + address + '", weekNum, claimBalance, proof)'
  );
};
