#!/usr/bin/env node

const { Command } = require("commander"); // add this line
const prompt = require('prompt-sync')({sigint: true});

const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
// const program = require('commander');
// const sign = require('./scripts/accounts')
// const collections = require('./scripts/list_collections')
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
  .option("-lc, --list_collections", "List NFT Market collections")
  .option("-mi, --market_items_list [value]", "List Market items")
  .option("-mint, --mint_nft", "Mint NFT")
  .option("-list, --list_nft", "List NFT item to Market place")
  .option("-tmth, --token_metadata", "List tokens methadata")
  .option("-sell, --token_sell", "Market sell NFT token")
  // .option("-t, --touch <value>", "Create a file")
  .parse(process.argv);

const options = program.opts();


if (options.wallet) {
    interaction.signer_info();
    interaction.contracts_info();
}
if(options.list_collections){
  
  interaction.list_collections();
}
if(options.market_items_list){
  const opt = typeof options.mi === "number"? options.mi : null;
  console.log(options.mi);
  interaction.get_market_items(opt)
}

if (options.mint_nft) {
  interaction.mintMarketItem();
}

if(options.list_nft){
  interaction.listToMarket()
}

if(options.token_metadata){
  interaction.getMarketItemsMetadata()
}

if(options.token_sell){
  interaction.marketSale()
}
