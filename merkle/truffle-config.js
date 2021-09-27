/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * truffleframework.com/docs/advanced/configuration
 *
 * To deploy via Infura you'll need a wallet provider (like truffle-hdwallet-provider)
 * to sign your transactions before they're sent to a remote public node. Infura accounts
 * are available for free at: infura.io/register.
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */

const Web3 = require("web3");
const HDWalletProvider = require("@truffle/hdwallet-provider");
require("dotenv").config();
const etherscanKey = process.env.ETHERSCAN_KEY;
const liveMnemonic = process.env.LIVE_MNEMONIC;
const liveNetwork = process.env.LIVE_NETWORK;
const fs = require("fs");
const path = require("path");
const ganacheMnemonic =
  "album wire record stuff abandon mesh museum piece bean allow refuse below";

const web3 = new Web3();

function walletProvider(filepath) {
  if (fs.existsSync(filepath)) {
    return () => {
      const file = fs.readFileSync(path.join(__dirname, filepath), "utf8");
      let { mnemonic, providerUrl } = JSON.parse(file);
      var HDWalletProvider = require("@truffle/hdwallet-provider");

      return new HDWalletProvider(mnemonic, providerUrl, 0, 3);
    };
  } else {
    return () => {
      throw "uh oh, you don't have that mnemonic";
    };
  }
}

const gas = 2200000;
const gasPrice = 3000000000;

module.exports = {
  networks: {
    live: {
      provider: () => new HDWalletProvider(liveMnemonic, liveNetwork),
      network_id: 1,
      gas,
      gasPrice: web3.utils.toWei("130", "gwei"),
      from: "0x8F942ECED007bD3976927B7958B50Df126FEeCb5"
    },
    development: {
      //host: "127.0.0.1", // Localhost (default: none)
      host: "localhost", // Localhost (default: none)
      port: 8545, // Standard Ethereum port (default: none)
      network_id: "*" // Any network (default: none)
    },
    dockerGanache: {
      provider: new HDWalletProvider(
        ganacheMnemonic,
        "http://ganache:8545",
        0,
        3
      ),
      network_id: "*" // Any network (default: none)
    },
    kovan: {
      confirmations: 2,
      provider: walletProvider("secrets_kovan.json"),
      network_id: 42,
      // gas,
      gasPrice
    }
  },
  mocha: {
    reporter: "eth-gas-reporter",
    reporterOptions: {
      currency: "USD",
      gasPrice: 50
    }
  },
  compilers: {
    solc: {
      version: "0.6.8" // Fetch exact version from solc-bin (default: truffle's version)
    }
  },
  api_keys: {
    etherscan: etherscanKey
  },
  plugins: ["truffle-plugin-verify"]
};
