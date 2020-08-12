const { MerkleTree } = require("../lib/merkleTree");
const fs = require("fs");

const loadTree = (utils, fileName) => {
  const rawdata = fs.readFileSync(fileName);
  const balances = JSON.parse(rawdata);

  let elements = [];
  let balance;
  let leaf;

  Object.keys(balances).forEach(address => {
    balance = utils.toWei(balances[address]);
    leaf = utils.soliditySha3(address, balance);
    elements.push(leaf);
  });

  return new MerkleTree(elements);
};

module.exports = { loadTree };
