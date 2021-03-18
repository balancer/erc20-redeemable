const TToken = artifacts.require("./TToken.sol");
const Redeem = artifacts.require("./MerkleRedeem.sol");
const { utils } = web3;

const MAX = utils.toTwosComplement(-1);

module.exports = (deployer, network, accounts) => {
  const admin = "0x8F942ECED007bD3976927B7958B50Df126FEeCb5";
  // const admin = accounts[0]; // "0x77c845E6A61F37cB7B237de90a74fbc3679FcF06"; // on Kovan

  deployer.then(async () => {
    // await deployer.deploy(TToken, "Test Bal", "TBAL", 18);
    // const token = await TToken.deployed();
    // await token.mint(admin, utils.toWei("145000"));
    console.log("deployer");
    // throw new Error('CANT FINISH!')

    await deployer.deploy(Redeem, "0x30cF203b48edaA42c3B4918E955fED26Cd012A3F");
    // await Redeem.deployed();
  });
};
