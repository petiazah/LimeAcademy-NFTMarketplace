import { expect, assert } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("NFTMarket", function () {

  const tokenURI_1 = "ipfs://QmUprsCe2pdn77mcfJWJZ1t84Y63yqaNq32tQoJB7hfMxK/"
  const tokenURI_2 = "ipfs://Qmd4QQPtbvaMtrV3U78xgY8hNuRMN4S3aPmugYzqikZSaF/"
  const auctionPrice = ethers.utils.parseEther('3')
  console.log(auctionPrice);

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

  async function deployFixture() {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();

    const MarketItem = await ethers.getContractFactory("MarketItem");
    const marketItem = await MarketItem.deploy();
    await marketItem.deployed();
    console.log("Petiazah NFT address:", marketItem.address);

    const MarketPlace = await ethers.getContractFactory("MarketPlace");
    const marketPlace = await MarketPlace.deploy();
    await marketPlace.deployed();
    console.log("MarketPlace address:", marketPlace.address);

    return { marketItem, marketPlace, owner, addr1, addr2 }
  }

  async function mintMarketItem() {
    const { marketItem, marketPlace, owner, addr1, addr2 } = await loadFixture(deployFixture);
    expect(await marketItem.balanceOf(owner.address)).to.equal(0);
    const tx = await marketItem.connect(owner).mintNFT(tokenURI_1);
    const receipt = await tx.wait()
    const tokenID = parseInt(receipt.logs[0].topics[3], 16)
    return { marketItem, marketPlace, owner, addr1, addr2, tokenID }
  }

  async function addItemToMarket() {
    const { marketItem, marketPlace, owner, addr1, addr2, tokenID } = await loadFixture(mintMarketItem);

    await marketPlace.connect(owner).createCollection("Dogs", "Dogs of the City");
    await marketPlace.connect(owner).createCollection("Cats", "Cat of the City");
    const dogCollection = await marketPlace.collections(1);
    const catCollection = await marketPlace.collections(2);

    await marketPlace.connect(owner).addNFTItemToMarket(marketItem.address, 1, dogCollection);
    await marketPlace.connect(owner).addNFTItemToMarket(marketItem.address, 2, catCollection);

    return { marketItem, marketPlace, owner, addr1, addr2 }

  }

  it("NFT is minted successfully", async function () {
    const { marketItem, marketPlace, owner, addr1, addr2 } = await loadFixture(deployFixture);
    expect(await marketItem.balanceOf(owner.address)).to.equal(0);
    const tx = await marketItem.connect(owner).mintNFT(tokenURI_1);
    const tokenID = await tx.wait(1)
    console.log(parseInt(tokenID.logs[0].topics[3], 16));
    expect(await marketItem.balanceOf(owner.address)).to.equal(1);

  });

  it("tokenURI is set sucessfully", async function () {
    const { marketItem, marketPlace, owner, addr1, addr2 } = await loadFixture(deployFixture);

    const tx1 = await marketItem.connect(addr1).mintNFT(tokenURI_1);
    const tx2 = await marketItem.connect(addr2).mintNFT(tokenURI_2);

    expect(await marketItem.tokenURI(1)).to.equal(tokenURI_1);
    expect(await marketItem.tokenURI(2)).to.equal(tokenURI_2);

  })

  it("Update market fee", async function () {
    const { marketItem, marketPlace, owner, addr1, addr2 } = await loadFixture(deployFixture);
    const tx1 = await marketPlace.connect(owner).updateMarketFee(100);
    const fee = await marketPlace.marketFee();
    assert.equal(fee.toNumber(), 100);
  });

  it("Create collection", async function () {
    const { marketItem, marketPlace, owner, } = await loadFixture(deployFixture);
    const tx1 = await marketPlace.connect(owner).createCollection("Dogs", "Dogs of the City");
    const collCount = await marketPlace.getCollectionsCount();
    assert.equal(collCount.toNumber(), 1);
    const collection = await marketPlace.collections(1);
    assert.equal(collection.name, "Dogs");
  });

  it("Add NFT to market", async function () {
    const { marketItem, marketPlace, owner, addr1, addr2, tokenID } = await loadFixture(mintMarketItem);

    await marketPlace.connect(owner).createCollection("Dogs", "Dogs of the City");
    await marketPlace.connect(owner).createCollection("Cats", "Cat of the City");
    const dogCollection = await marketPlace.collections(1);
    const catCollection = await marketPlace.collections(2);

    await marketPlace.connect(owner).addNFTItemToMarket(marketItem.address, 1, dogCollection);
    const itemId = await marketPlace.getMarketItemsCount();
    assert.equal(itemId, 1);

    await expect(marketPlace.connect(owner).addNFTItemToMarket(marketItem.address, 2, dogCollection))
      .to.emit(marketPlace, "NFTItemAction");

    await expect(marketPlace.connect(owner).addNFTItemToMarket(marketItem.address, 1, catCollection))
      .to.be.revertedWith('NFT already exists on the market!');

  });

  it("List NFT to market", async function () {
    const { marketItem, marketPlace, owner, addr1, addr2 } = await addItemToMarket();

    const result: NFTItem = await marketPlace.getMarketItems(1);
    console.log(result.toString())

    let listingPrice = await marketPlace.marketFee()
    listingPrice = listingPrice.toString()
    console.log(listingPrice)


    console.log("Approving Marketplace as operator of NFT...")
    const approvalTx = await marketItem
      .connect(owner)
      .approve(marketPlace.address, result.tokenId)
    await approvalTx.wait(1)


    await expect(marketPlace.connect(owner).listNFTItemToMarket(result.itemId, result.nftContract, 20, auctionPrice, { value: listingPrice }))
      .to.be.revertedWith('ERC721: invalid token ID');

    await expect(marketPlace.connect(owner).listNFTItemToMarket(result.itemId, result.nftContract, result.tokenId, 0, { value: listingPrice }))
      .to.be.revertedWith('Price should be more than 0 PLZ.');

    await expect(marketPlace.connect(owner).listNFTItemToMarket(result.itemId, result.nftContract, result.tokenId, auctionPrice, { value: 0 }))
      .to.be.revertedWith('Need to pay market fee.');

    await expect(marketPlace.connect(owner).listNFTItemToMarket(result.itemId, result.nftContract, result.tokenId, auctionPrice, { value: listingPrice }))
      .to.emit(marketPlace, "NFTItemAction");

    const resultListed: NFTItem = await marketPlace.getMarketItems(1);
    console.log(resultListed.toString())

    assert.equal(resultListed.owner, marketPlace.address);
    assert.equal(resultListed.price, auctionPrice.toNumber());

    ///////////////////////////////////////////////////////////////

    await expect(marketPlace.MarketSaleNFT(result.itemId, { value: 10 }))
      .to.be.revertedWith('Please provide appropriate price');

    await expect(marketPlace.MarketSaleNFT(result.itemId))
      .to.be.revertedWith('Please provide appropriate price');

    const price = ethers.utils.parseEther("3.0")
    const sellTx = await marketPlace.MarketSaleNFT(result.itemId, {value: price});
    await sellTx;

    // await expect(marketPlace.MarketSaleNFT(result.itemId, {value: auctionPrice}))
    //   .to.emit(marketPlace, "NFTItemAction");

    // const resultSell: NFTItem = await marketPlace.getMarketItems(1);
    //   console.log(resultSell.toString())
  

  });

  // it("Make a sell", async function () {
  //     const { marketItem, marketPlace, owner, addr1, addr2 } = await addItemToMarket();

  //   const result: NFTItem = await marketPlace.getMarketItems(1);

  //   let listingPrice = await marketPlace.marketFee()
  //   listingPrice = listingPrice.toString()
  //   console.log(listingPrice)


  //   console.log("Approving Marketplace as operator of NFT...")
  //   const approvalTx = await marketItem
  //     .connect(owner)
  //     .approve(marketPlace.address, result.tokenId)
      
  //   await approvalTx.wait(1)

  //   await expect(marketPlace.MarketSaleNFT(result.itemId))
  //     .to.be.revertedWith('Please provide appropriate price');

  //   const resultListed: NFTItem = await marketPlace.getMarketItems(1);
  //   console.log(resultListed.owner)
  //   console.log(marketPlace.address)


  //   // await expect(marketPlace.connect(owner).MarketSaleNFT(result.itemId))
  //   //   .to.be.revertedWith('Sender is not an owner');

  //   // await expect(marketPlace.MarketSaleNFT(result.itemId))
  //   //   .to.be.revertedWith('Please provide appropriate price');

  // });


})


