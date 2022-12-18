import { uploadFileToIPFS, uploadMetadataToIPFS } from "./pinata";
import { keys } from 'ts-transformer-keys';
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
    try {
      const balance = await provider.wallet.getBalance();
      const signer = await provider.wallet.address;
      console.log("Signer wallet ballance: " + balance.toString())
      console.log("Signer address: " + signer.toString())
    }  catch (e) {
      console.log(chalk.red(e));
    }
   
  }

  async get_contracts_info() {
    try {
      await this.contracts_info([contract.marketPlace, contract.marketItem])
      
    } catch (e) {
      console.log(chalk.red(e));
    }
   
  }



  async contracts_info(contracts: any[]) {
    try {
      contracts.forEach(async item => {
        const balance = await provider.provider.getBalance(item.address);
        console.log(`${item === contract.marketPlace ? "MarketPlace" : "MarketItem"} with address ${item.address} has ballance of ${balance}`);
      });
      
    } catch (e) {
      console.log(chalk.red(e));
    }
  }

  async list_collections() {

    const collections: Collection[] = await contract.marketPlace.getCollections();
    console.table(collections);
    return collections;
  }

  async create_collection() {
    try {

      const name = await prompt(chalk.green('Enter collection name '))
      const description = await prompt(chalk.green('Enter collection description '))
      console.log(chalk.green("Transaction wait..."))
      const tx = await contract.marketPlace.createCollection(name, description);
      await tx.wait(1);
      await this.list_collections()

    } catch (error) {
      console.log(error)
    }

  }

  async get_market_items(opt?: number) {

    try {

      let marketItemsArrey: NFTItem[] = [];
      if (typeof opt !== 'undefined') {
        const item: NFTItem = await contract.marketPlace.getMarketItem(opt);
        marketItemsArrey[0] = item;
      }
      else {
        marketItemsArrey = await contract.marketPlace.getMarketItems();
      }
        marketItemsArrey.forEach(item => {
          console.table({
            "itemId": item.itemId,
            "collection": item.collection,
            "nftContract": item.nftContract,
            "tokenId": item.tokenId,
            "seller": item.seller,
            "owner": item.owner,
            "price": item.price,
            "sold": item.sold
          });
        });
      
  
      return marketItemsArrey;
      
    } catch (e) {
      console.log(chalk.red(e));
    }

  }

  //// Dependency exception
  // async get_market_items_byFilter(opt?: string, value?: any) {

  //   try {
  //     let marketItemsArrey: NFTItem[] = [];
  //     if (typeof opt !== 'undefined') {
      
  //     const keysOfProps = keys<NFTItem>();
  //     console.log(keysOfProps);
  //     //  marketItemsArrey = await contract.marketPlace.getMarketItems()
  //     //  .filter(() => keysOfProps.filter(key=>key==opt && key[value]==value));
  //     }
  //     else
  //       marketItemsArrey = await contract.marketPlace.getMarketItems()
    
  //       marketItemsArrey.forEach(item => {
  //         console.table({
  //           "itemId": item.itemId,
  //           "collection": item.collection,
  //           "nftContract": item.nftContract,
  //           "tokenId": item.tokenId,
  //           "seller": item.seller,
  //           "owner": item.owner,
  //           "price": item.price,
  //           "sold": item.sold
  //         });
  //       });
      
  
  //     return marketItemsArrey;
      
  //   } catch (e) {
  //     console.log(chalk.red(e));
  //   }

  // }

  async mintMarketItem() {

    try {
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
  
      console.log(chalk.green("Minting....."))
      const tx = await contract.marketItem.mintNFT(metadataURL);
      const receipt = await tx.wait()
      const tokenID = parseInt(receipt.logs[0].topics[3], 16)
      console.log("Minted NFT with  tokenId:" + tokenID)
  
  
      await this.addToMarket(tokenID, Number(id)+1, collection);
    } catch (e) {
      console.log(chalk.red(e));
    }
    
  }

  async addToMarket(tokenId: number, collectionId: any, collection: Collection) {

    console.log(`Add to market place ${tokenId} ${collection.name} ${contract.marketItem.address} ${contract.marketPlace.address}`);
    var transaction = await contract.marketPlace.addNFTItemToMarket(contract.marketItem.address, tokenId, collectionId);
    await transaction.wait();
  }

  async getMarketItemsMetadata() {
    try {
      const marketItems: NFTItem[] = await contract.marketPlace.getMarketItems();

      marketItems.forEach(async function (item) {
        const metadata = await contract.marketItem.tokenURI(item.tokenId);
  
        const response = await fetch(metadata);
  
        if (!response.ok)
          throw new Error(response.statusText);
  
        const json = await response.json();
        console.table(json)
      });
      
    } catch (e) {
      console.log(chalk.red(e));
    }
  }

  async marketFee(fee?: number) {
    try {
      console.log(chalk.green("Transaction wait..."))
      if (typeof fee !== 'undefined') {
        const tx = await contract.marketPlace.updateMarketFee(fee);
        await tx.wait(1);
      }

      var listingPrice = await contract.marketPlace.marketFee();
      console.log("Market listing price (in wei): " + listingPrice.toNumber());

    } catch (error) {
      console.log(error)
    }
  }

  async listToMarket() {

    try {
      var listingPrice = await contract.marketPlace.marketFee();
      console.log("Market listing price (in wei): " + listingPrice.toNumber());

      var notListedItems = (await contract.marketPlace.getMarketItems()).filter((item: any) => item.price == 0)
      console.log(chalk.green("Non listed NFTs:"))

      notListedItems.forEach((item: any) => {
        console.table(item)
      });

      const currentId = prompt(chalk.green('Enter NFT id for listing: '));
      const price = prompt(chalk.green('Enter NFT price (in wei): '));

      const nftToList = await contract.marketPlace.getMarketItem(currentId);

      console.log(chalk.green("Listing....."))

      var listTransaction = await contract.marketPlace.listNFTItemToMarket(nftToList.itemId, nftToList.nftContract, nftToList.tokenId, price, { value: listingPrice.toNumber() })
      await listTransaction.wait();
    }
    catch (e) {
      console.log(chalk.red(e));
    }
  }

  async marketSale() {

    var notSoldItems = (await contract.marketPlace.getMarketItems()).filter((item: any) => item.sold == false)
    console.log("Listed NFTs:")

    notSoldItems.forEach((item: any) => {
      console.table(item)
    });

    const currentId = prompt(chalk.green('Enter NFT id you want to buy: '));
    const nftToBuy = await contract.marketPlace.getMarketItem(currentId);
    console.log("Wait for transaction....")
    await contract.marketPlace.MarketSaleNFT(nftToBuy.itemId, { value: nftToBuy.price });
  }
}
module.exports = Interaction
export { }


