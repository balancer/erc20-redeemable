const TToken = artifacts.require("./TToken.sol");
const Redeem = artifacts.require("./MerkleRedeem.sol");
const { utils } = web3;

module.exports = (deployer, network, accounts) => {
  // const admin = accounts[0]; // "0x77c845E6A61F37cB7B237de90a74fbc3679FcF06"; // on Kovan
  const admin = "0x8F942ECED007bD3976927B7958B50Df126FEeCb5";
  deployer.then(async () => {
    console.log("Finish Disburse");
    throw new Error("CANT FINISH!");

    // const token = await TToken.deployed();
    // await token.mint(admin, utils.toWei("5000"));
    //
    // const redeem = await Redeem.deployed();
    //
    // let weekNum = 1 // adjust accordingly
    //
    // await redeem.seedAllocations(weekNum, "0xecd3aa0b1483b0a141e7df656c4b8ffd0cf3ace2bd8c9c60b85669f625dedccb", utils.toWei("4450.862343625"));
  });
};
