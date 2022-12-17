import { uploadFileToIPFS, uploadMetadataToIPFS } from "./pinata";
const fetch = require('node-fetch');
const prompt = require('prompt-sync')({ sigint: true });
const files = require('./list_files')
const chalk = require('chalk');
require('./pinata')

const Contract = require('./Contract')
const Provider = require('./Provider')

const provider = new Provider()
const contract = new Contract()

interface NFTItem {
  itemId: number;
  collection: Collection;
  nftContract: string;
  tokenId: number;
  seller: string;
  owner: string;
  price: number;
  sold: boolean;
}

interface Collection {
  name: string;
  description: string;
}

class Interaction {

  constructor() {
    contract.marketPlace.on('NFTItemAction', (nft: NFTItem) => {
      console.log("Marketplace event");
      console.table(nft);
    })
  }

  async signer_info() {
    const balance = await provider.wallet.getBalance();
    const signer = await provider.wallet.address;
    console.log("Signer wallet ballance: " + balance.toString())
    console.log("Signer address: " + signer.toString())
  }

  async contracts_info() {
    const balance = await provider.provider.getBalance(contract.marketPlace.address);
    console.log("Marketplace address: "+ contract.marketPlace.address + " balance: " + balance);
    console.log(contract.marketItem.address);
  }

  async list_collections() {

    const collections: Collection[] = await contract.marketPlace.getCollections();
    console.table(collections);
    return collections;
  }

  async get_market_items(opt?: number) {

    let marketItemsArrey: NFTItem[] = [];
    console.log(opt);
    if (opt) {
      const item: NFTItem = await contract.marketPlace.getMarketItem(opt);
      console.log(item);
    }
    else {
      marketItemsArrey = await contract.marketPlace.getMarketItems();
      marketItemsArrey.forEach(item => {
        console.table({"itemId": item.itemId,
        "collection": item.collection,
        "nftContract": item.nftContract,
        "tokenId": item.tokenId,
        "seller": item.seller,
        "owner": item.owner,
        "price": item.price,
        "sold": item.sold});
      });
    }

    return marketItemsArrey;

  }

  async mintMarketItem() {


    const collections = await this.list_collections();
    const id = await prompt(chalk.red('Enter collection id '))

    const name = await prompt('Enter NFT name ');
    const description = await prompt('Enter NFT description ')

    const file1 = await files();

    file1.forEach((element: any) => {
      console.log(element);
    });

    const fileName = prompt('Enter file name ')

    console.log(name, description, fileName);



    const collection = collections[id];
    const formParams = { name: name, description: description };
    let fileURI = '';

    //upload the file to IPFS
    const response = await uploadFileToIPFS(fileName);
    if (response.success === true) {
      console.log("Uploaded image to Pinata: ", response.pinataURL)
      fileURI = response.pinataURL;
      console.log(fileURI);
    }

    const metadataURL = await uploadMetadataToIPFS(formParams, collection, fileURI);
    console.log(metadataURL);

    const tx = await contract.marketItem.mintNFT(metadataURL);
    const receipt = await tx.wait()
    const tokenID = parseInt(receipt.logs[0].topics[3], 16)
    console.log("Minted NFT with  tokenId:" + tokenID)


    await this.addToMarket(tokenID, id);
  }

  async addToMarket(tokenId: number, collectionId: any) {

    console.log(`Add to market place ${tokenId} ${contract.marketItem.collection.name} ${contract.marketItem.address} ${contract.marketPlace.address}`);
    var transaction = await contract.marketPlace.addNFTItemToMarket(contract.marketItem.address, tokenId, collectionId);
    await transaction.wait();
  }

  async getMarketItemsMetadata(){
    const marketItems: NFTItem[] = await contract.marketPlace.getMarketItems();

    marketItems.forEach(async function(item) {
        const metadata = await contract.marketItem.tokenURI(item.tokenId);
        
        const response = await fetch(metadata);

        if(!response.ok)
          throw new Error(response.statusText);

        const json = await response.json();
        console.table(json)
      });

  }


  async listToMarket() {

    try {
      var listingPrice = await contract.marketPlace.marketFee();
      console.log("Market listing price (in wei): " + listingPrice.toNumber());

      var notListedItems = (await contract.marketPlace.getMarketItems()).filter((item: any) => item.price == 0)
      console.log("Not listed NFTs:")

      notListedItems.forEach((item: any) => {
        console.table(item)
      });

      const currentId = prompt(chalk.blue('Enter NFT id for listing: '));
      const price = prompt(chalk.blue('Enter NFT price (in wei): '));

      const nftToList = await contract.marketPlace.getMarketItem(currentId);

      var listTransaction = await contract.marketPlace.listNFTItemToMarket(nftToList.itemId, nftToList.nftContract, nftToList.tokenId, price, { value: listingPrice.toNumber() })
      await listTransaction.wait();
    }
    catch (e) {
      console.log(chalk.red("Upload error" + e));
    }
  }

  async marketSale(){

    var notSoldItems = (await contract.marketPlace.getMarketItems()).filter((item: any) => item.sold == false)
    console.log("Listed NFTs:")

    notSoldItems.forEach((item: any) => {
      console.table(item)
    });

    const currentId = prompt(chalk.blue('Enter NFT id you want to buy: '));
    const nftToBuy = await contract.marketPlace.getMarketItem(currentId);
    console.log("Wait for transaction....")
    await contract.marketPlace.MarketSaleNFT(nftToBuy.itemId, { value: nftToBuy.price });
  }
}
module.exports = Interaction
export { }


