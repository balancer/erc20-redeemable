const TToken = artifacts.require("./TToken.sol");
const Redeem = artifacts.require("./MerkleRedeem.sol");
const { utils } = web3;

module.exports = (deployer, network, accounts) => {
  const admin = accounts[0]; // "0x77c845E6A61F37cB7B237de90a74fbc3679FcF06"; // on Kovan
  deployer.then(async () => {
    await deployer.deploy(TToken, "Test Bal", "TBAL", 18);
    const token = await TToken.deployed();
    await token.mint(admin, utils.toWei("145000"));

    await deployer.deploy(Redeem, token.address);
    const redeem = await Redeem.deployed();

    await token.transfer(redeem.address, utils.toWei("20000"));
  });
};
