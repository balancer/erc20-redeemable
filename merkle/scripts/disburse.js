//const Redeem = artifacts.require("./MerkleRedeem.sol");
const { MerkleTree } = require("../lib/merkleTree");
const { utils, eth } = web3;
const fs = require("fs");
const readline = require("readline");

module.exports = async function(callback) {
  let elements = [];

  //let redeem = await Redeem.deployed();
  console.log("File Path Arg (must be absolute):", process.argv[4]);

  const rawdata = fs.readFileSync(process.argv[4]);
  const balances = JSON.parse(rawdata);

  console.log(balances);

  Object.keys(balances).forEach(address => {
    let balance = balances[address];
    let leaf = utils.soliditySha3(address, parseInt(balance));
    console.log("Adding leaf:\t", leaf, " for ", address, balance);
    elements.push(leaf);
  });

  const merkleTree = new MerkleTree(elements);
  const root = merkleTree.getHexRoot();
  console.log("tree has root:\t", root);
};
