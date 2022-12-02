import "@nomiclabs/hardhat-ethers";


const hre = require('hardhat')
const ethers = hre.ethers;

async function deployMarketPlaceContracts() {
  await hre.run('compile'); // We are compiling the contracts using subtask
  const [deployer] = await ethers.getSigners(); // We are getting the deployer

  console.log('Deploying contracts with the account:', deployer.address); // We are printing the address of the deployer
  console.log('Account balance:', (await deployer.getBalance()).toString()); // We are printing the account balance

  const MarketPlace = await ethers.getContractFactory("MarketPlace");
  const marketPlace = await MarketPlace.deploy();
  const marketPlaceTokenDeployed = await marketPlace.deployed();
  console.log("MarketPlace address:", marketPlace.address);

  const MarketItem = await ethers.getContractFactory("MarketItem");
  const marketItem = await MarketItem.deploy(marketPlace.address);
  const marketItemTokenDeployed = await marketItem.deployed();
  console.log("Petiazah NFT address:", marketItem.address);

}

deployMarketPlaceContracts().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

  module.exports = deployMarketPlaceContracts;