const hre = require('hardhat')
const ethers = hre.ethers;

async function deployMarketContracts(_privateKey) {
    await hre.run('compile'); // We are compiling the contracts using subtask
    const wallet = new ethers.Wallet(_privateKey, hre.ethers.provider) // New wallet with the privateKey passed from CLI as param
    console.log('Deploying contracts with the account:', wallet.address); // We are printing the address of the deployer
    console.log('Account balance:', (await wallet.getBalance()).toString()); // We are printing the account balance

    const MarketItem = await ethers.getContractFactory("MarketItem");
    const marketItem = await MarketItem.deploy();
    await marketItem.deployed();
    console.log("Petiazah NFT address:", marketItem.address);
  
    const MarketPlace = await ethers.getContractFactory("MarketPlace");
    const marketPlace = await MarketPlace.deploy();
    await marketPlace.deployed();
    console.log("MarketPlace address:", marketPlace.address);
  
}
  
module.exports = deployMarketContracts;