const ethers = require("ethers")

require('dotenv').config();

const infuraApiKey = process.env.INFURA_API_KEY;
if (!infuraApiKey) {
    throw new Error("Please set your INFURA_API_KEY in a .env file");
}

const goerliKey = process.env.GOERLI_API_KEY;
if (!goerliKey) {
    throw new Error("Please set your GOERLI API key in a .env file");
}

class Provider {

    provider: any;
    wallet: any;

    constructor() {
         this.provider = new ethers.providers.InfuraProvider("goerli", infuraApiKey)
         this.wallet = new ethers.Wallet(goerliKey, this.provider);
    }

}
module.exports = Provider
export{}