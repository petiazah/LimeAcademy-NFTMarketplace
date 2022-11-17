import "@nomiclabs/hardhat-ethers";

const hre = require("hardhat");
const BookLibrary = require('../artifacts/contracts/BookLibrary.sol/BookLibrary.json')
const printData = false;

const run = async function() {

      const provider = new hre.ethers.providers.JsonRpcProvider("http://127.0.0.1:8545/")
      const latestBlock = await provider.getBlock("latest")


      const wallet = new hre.ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
      const balance = await wallet.getBalance();
    

      const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
      const bookLibraryContractInstance = new hre.ethers.Contract(contractAddress, BookLibrary.abi, wallet)
   


   /// Add book
  const addBook = await bookLibraryContractInstance.addBook("Once upon", 4);
  var transactionReceipt = await addBook.wait();
  if (transactionReceipt.status != 1) { // 1 means success
    console.log("Add book transaction was not successful")
    return 
    }
  /// Get available books
  await bookData();

  //// rent a book
  const aliceWallet = new hre.ethers.Wallet("0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", provider)
  const aliceContractInstance = new hre.ethers.Contract(contractAddress, BookLibrary.abi, aliceWallet)
  const borrowBook = await aliceContractInstance.borrowBook(1)
  var transactionReceipt = await borrowBook.wait();
  if (transactionReceipt.status != 1) { // 1 means success
  console.log("Borrow transaction was not successful")
  return 
  }

  await bookData();

  //// return book
  const returnBook = await aliceContractInstance.returnBook(1)
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

