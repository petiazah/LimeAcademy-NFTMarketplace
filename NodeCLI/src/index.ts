#!/usr/bin/env node

const { Command } = require("commander"); // add this line
const prompt = require('prompt-sync')({ sigint: true });

const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const Interaction = require('./scripts/interact')
const interaction = new Interaction()

//clear();
console.log(
  chalk.green(
    figlet.textSync('NFT-Marketplace-CLI', { horizontalLayout: 'full' })
  )
);


const program = new Command();

program
  .version("1.0.0")
  .description("An example CLI for managing NFT market place")
  .option("-w, --wallet", "Wallet connection")
  .option("-ci, --contracts_info", "Get MarketPlace and MarketItem contract info")
  .option("-cc, --create_collection", "Create Market NFt collection")
  .option("-lc, --list_collections", "List NFT Market collections")
  .option("-mf, --market_fee [value]", "Get or set market fee [set value]")
  .option("-mi, --market_items_list [value]", "List Market items [required id]")
  // .option("-mif, --market_items_list_filter [value, value]", "List Market items by filter [id,]") !!!! Dependency panik!!!!
  .option("-mint, --mint_nft", "Mint NFT")
  .option("-list, --list_nft", "List NFT item to Market place")
  .option("-tmth, --token_metadata", "List tokens methadata")
  .option("-sell, --token_sell", "Market sell NFT token")
  .parse(process.argv);

const options = program.opts();

if (options.wallet) {
  interaction.signer_info();
  interaction.get_contracts_info()
}
if (options.list_collections) {

  interaction.list_collections();
}
if (options.market_items_list) {
  interaction.get_market_items(options.market_items_list[0])
}

if (options.mint_nft) {
  interaction.mintMarketItem();
}

if (options.list_nft) {
  interaction.listToMarket()
}

if (options.token_metadata) {
  interaction.getMarketItemsMetadata()
}

if (options.token_sell) {
  interaction.marketSale()
}

if (options.contracts_info) {
  interaction.get_contracts_info()
}

if (options.create_collection) {
  interaction.create_collection()
}

if (options.market_fee) {
  interaction.marketFee(options.market_fee[0])
}

if(options.market_items_list_filter)
{
   interaction.get_market_items_byFilter(options.market_items_list_filter[0],options.market_items_list_filter[1] )
}

