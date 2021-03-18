const Migrations = artifacts.require("Migrations");

module.exports = async function(deployer) {
  // const a = await Migrations.at('0x43F5226753dbC182c596908aaef4CB98b555F71F')

  deployer.deploy(Migrations, { overwrite: false });
};
