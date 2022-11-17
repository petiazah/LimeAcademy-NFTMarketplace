import "@nomiclabs/hardhat-ethers";


const hre = require('hardhat')
const ethers = hre.ethers;

async function deployLibraryContract() {
  await hre.run('compile'); // We are compiling the contracts using subtask
  const [deployer] = await ethers.getSigners(); // We are getting the deployer

  console.log('Deploying contracts with the account:', deployer.address); // We are printing the address of the deployer
  console.log('Account balance:', (await deployer.getBalance()).toString()); // We are printing the account balance

  const BookLibrary = await ethers.getContractFactory("BookLibrary");
  const bookLibrary = await BookLibrary.deploy();
  await bookLibrary.deployed();
  console.log("Collection name:", bookLibrary.address);

}

deployLibraryContract().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

  module.exports = deployLibraryContract;