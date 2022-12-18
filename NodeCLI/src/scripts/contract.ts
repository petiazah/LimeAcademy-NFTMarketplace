const ethers =require("ethers")
const Provider = require('./Provider')
const provider = new Provider()
const {marketItemAddress, marketItemAbi} = require('./market_item')
const {marketPlaceAddress, marketPlaceAbi} = require('./market_place')
class Contract {

  marketPlace: any;
  marketItem:any;

  constructor() {
     this.marketPlace = new ethers.Contract(marketPlaceAddress, marketPlaceAbi, provider.wallet);
     this.marketItem = new ethers.Contract(marketItemAddress, marketItemAbi, provider.wallet);
  }

}
module.exports = Contract
export{}