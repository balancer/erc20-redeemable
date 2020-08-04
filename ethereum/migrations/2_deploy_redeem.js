const TToken = artifacts.require("./TToken.sol");
const Redeem = artifacts.require("./Redeem.sol");
const { utils } = web3;

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    await deployer.deploy(TToken, "Test Bal", "TBAL", 18);
    const token = await TToken.deployed();
    //await token.mint(utils.toWei("145000"))

    await deployer.deploy(Redeem, token.address);
    const redeem = await Redeem.deployed();

    //await token.transfer(redeem.address, utils.toWeir("20000")
  });
};
