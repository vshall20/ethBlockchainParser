var HDWalletProvider = require("truffle-hdwallet-provider");

var mnemonic = "diamond relief love fetch toddler tumble paddle tell verify cake sheriff knock";

module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '666'
    },
    rinkeby:{
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/ueMsufJK5QxoaganeO6G")
      },
      network_id: 4
    },
    ropsten: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://ropsten.infura.io/ueMsufJK5QxoaganeO6G")
      },
      network_id: 3
    },
    mainnet:{
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://mainnet.infura.io/ueMsufJK5QxoaganeO6G")
      },
      network_id: 1
    }
  }
}
