import { expect, assert } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
const { BigNumber } = require("@ethersproject/bignumber");

describe("NFTMarket", function () {

  const tokenURI_1 = "ipfs://QmUprsCe2pdn77mcfJWJZ1t84Y63yqaNq32tQoJB7hfMxK/"
  const tokenURI_2 = "ipfs://Qmd4QQPtbvaMtrV3U78xgY8hNuRMN4S3aPmugYzqikZSaF/"
  const auctionPrice = "3" //ethers.utils.parseUnits("3", 'wei')
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

    const MarketPlace = await ethers.getContractFactory("MarketPlace");
    const marketPlace = await MarketPlace.deploy();
    await marketPlace.deployed();
    console.log("MarketPlace address:", marketPlace.address);

    const MarketItem = await ethers.getContractFactory("MarketItem");
    const marketItem = await MarketItem.deploy(marketPlace.address);
    await marketItem.deployed();
    console.log("Petiazah NFT address:", marketItem.address);

    return { marketItem, marketPlace, owner, addr1, addr2 }
  }

  async function mintMarketItem() {
    const { marketItem, marketPlace, owner, addr1, addr2 } = await loadFixture(deployFixture);
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
    await expect(marketPlace.connect(owner).createCollection("Dogs", "Dogs of the City"))
      .to.be.revertedWith('Collection name already exists');

    const collections = await marketPlace.getCollections();
    assert.equal(collections.length, 1);
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

    const result: NFTItem = await marketPlace.getMarketItem(1);
    console.log(result.toString())

    let listingPrice = await marketPlace.marketFee()
    listingPrice = listingPrice.toString()
    console.log(listingPrice)

    await expect(marketPlace.connect(owner).listNFTItemToMarket(result.itemId, result.nftContract, 20, auctionPrice, { value: listingPrice }))
      .to.be.revertedWith('ERC721: invalid token ID');

    await expect(marketPlace.connect(owner).listNFTItemToMarket(result.itemId, result.nftContract, result.tokenId, 0, { value: listingPrice }))
      .to.be.revertedWith('Price should be more than 0');

    await expect(marketPlace.connect(owner).listNFTItemToMarket(result.itemId, result.nftContract, result.tokenId, auctionPrice, { value: 0 }))
      .to.be.revertedWith('Need to pay market fee.');

    await expect(marketPlace.connect(owner).listNFTItemToMarket(result.itemId, result.nftContract, result.tokenId, auctionPrice, { value: listingPrice }))
      .to.emit(marketPlace, "NFTItemAction");

    const resultListed: NFTItem = await marketPlace.getMarketItem(1);
    console.log(resultListed.toString())

    assert.equal(resultListed.owner, marketPlace.address);
    assert.equal(resultListed.price.toString(), auctionPrice);

  });

  it("Make a sell", async function () {
    const { marketItem, marketPlace, owner, addr1, addr2 } = await addItemToMarket();

    const result: NFTItem = await marketPlace.getMarketItem(1);

    let listingPrice = await marketPlace.marketFee()

    await marketPlace.connect(owner).listNFTItemToMarket(result.itemId, result.nftContract, result.tokenId, auctionPrice, { value: listingPrice });

    await expect(marketPlace.connect(addr1).MarketSaleNFT(result.itemId))
      .to.be.revertedWith('Need appropriate price.');

    await expect(marketPlace.connect(addr1).MarketSaleNFT(result.itemId, { value: auctionPrice }))
      .to.emit(marketPlace, "NFTItemAction");

    const resultListed: NFTItem = await marketPlace.getMarketItem(1);
    assert.equal(resultListed.owner, addr1.address);
    assert.equal(resultListed.price, 0);

  });

  it("Get market items", async function(){

    const { marketItem, marketPlace, owner, addr1, addr2 } = await addItemToMarket();
    const result: NFTItem = await marketPlace.getMarketItem(1);

    const marketItemsArrey = await marketPlace.getMarketItems();
    assert.equal(marketItemsArrey.length, 2);

  });

})

