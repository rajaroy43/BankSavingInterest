require("@nomiclabs/hardhat-waffle");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.0",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337,
      /*
        notice no mnemonic here? it will just use account 0 of the hardhat node to deploy
        (you can put in a mnemonic here to set the deployer locally)
      */
    },
    rinkeby: {
      url: process.env.RINKEBY_PROVIDER_ENDPOINT, //<---- YOUR INFURA ID! (or it won't work)
      accounts: [process.env.RINKEBY_PRIVATE_KEY],
    },
  }

};
