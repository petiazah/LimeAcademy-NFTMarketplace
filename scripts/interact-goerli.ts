import "@nomiclabs/hardhat-ethers";

const hre = require("hardhat");
const BookLibrary = require('../artifacts/contracts/BookLibrary.sol/BookLibrary.json')
const printData = true;

const infuraApiKey: string | undefined = process.env.INFURA_API_KEY;
if (!infuraApiKey) {
  throw new Error("Please set your INFURA_API_KEY in a .env file");
}

const contractDeployedAddress: string = process.env.CONTRACT_ADDRESS!;
if (!contractDeployedAddress) {
  throw new Error("Please set your contract address in a .env file");
}

const goerliKey: string  = process.env.GOERLI_API_KEY!;
if (!goerliKey) {
  throw new Error("Please set your GOERLI API key in a .env file");
}

const run = async function() {


    const provider = new hre.ethers.providers.InfuraProvider("goerli", infuraApiKey)
    const latestBlock = await provider.getBlock("latest")
    // console.log(latestBlock.hash)

    const wallet = new hre.ethers.Wallet(goerliKey, provider);
    const balance = await wallet.getBalance();
    // console.log(balance.toString())
    // console.log(hre.ethers.utils.formatEther(balance, 18))

    const contractAddress = contractDeployedAddress
    const bookLibraryContractInstance = new hre.ethers.Contract(contractAddress, BookLibrary.abi, wallet)
    // console.log(bookLibraryContractInstance)

      /// Add book
  const addBook = await bookLibraryContractInstance.addBook("LimeAcademy", 4);
  var transactionReceipt = await addBook.wait();
  if (transactionReceipt.status != 1) { // 1 means success
    console.log("Add book transaction was not successful")
    return 
    }
  /// Get available books
  await bookData();

  //// rent a book
  // const aliceWallet = new hre.ethers.Wallet("0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", provider)
  // const aliceContractInstance = new hre.ethers.Contract(contractAddress, BookLibrary.abi, aliceWallet)
  const borrowBook = await bookLibraryContractInstance.borrowBook(1)
  var transactionReceipt = await borrowBook.wait();
  if (transactionReceipt.status != 1) { // 1 means success
  console.log("Borrow transaction was not successful")
  return 
  }

  await bookData();

  //// return book
  const returnBook = await bookLibraryContractInstance.returnBook(1)
  var transactionReceipt = await returnBook.wait();
  if (transactionReceipt.status != 1) { // 1 means success
  console.log("Return transaction was not successful")
  return 
  }

  await bookData();


  async function bookData() {
    if(printData){
      const availableBookBNArray = await bookLibraryContractInstance.getAvailableBooks();
      const avlBook = availableBookBNArray.map((item) => item.toNumber());
       avlBook.forEach(async element => {
      const { 0: bookName } = await bookLibraryContractInstance.getBookDetail(element);
      const { 1: totalCount } = await bookLibraryContractInstance.getBookDetail(element);
      console.log(bookName + " Copies: " + totalCount);
    });
    }
  }
}

run()

