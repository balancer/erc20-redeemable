const Redeem = artifacts.require("./MerkleRedeem.sol");
const { MerkleTree } = require("../lib/merkleTree");
const { utils, eth } = web3;
const fs = require("fs");
const readline = require("readline");

module.exports = async function(callback) {
  let elements = [];

  let reedem = await Redeem.deployed();
  console.log("File Path Arg (must be absolute):", process.argv[4]);

  const lineReader = readline.createInterface({
    input: fs.createReadStream(process.argv[4])
  });

  lineReader.on("line", line => {
    let address, balance;
    [address, balance] = line.split(",");
    let leaf = utils.soliditySha3(address, parseInt(balance));
    console.log("Adding leaf:\t", leaf, " for ", address, balance);
    elements.push(leaf);
  });

  lineReader.on("close", () => {
    const merkleTree = new MerkleTree(elements);
    const root = merkleTree.getHexRoot();
    console.log("tree has root:\t", root);
  });
};
