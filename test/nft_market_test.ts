import { expect, assert } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("NFTMarket", function () {

  const tokenURI_1 = "ipfs://QmUprsCe2pdn77mcfJWJZ1t84Y63yqaNq32tQoJB7hfMxK/"
  const tokenURI_2 = "ipfs://Qmd4QQPtbvaMtrV3U78xgY8hNuRMN4S3aPmugYzqikZSaF/"

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
    await marketItem.connect(owner).mintNFT(tokenURI_1);
    return { marketItem, marketPlace, owner, addr1, addr2 }
  }


  it("NFT is minted successfully", async function () {
    const { marketItem, marketPlace, owner, addr1, addr2 } = await loadFixture(deployFixture);
    expect(await marketItem.balanceOf(owner.address)).to.equal(0);
    const tx = await marketItem.connect(owner).mintNFT(tokenURI_1);
    expect(await marketItem.balanceOf(owner.address)).to.equal(1);
  });

  it("tokenURI is set sucessfully", async function () {
    const { marketItem, marketPlace, owner, addr1, addr2 } = await loadFixture(deployFixture);

    const tx1 = await marketItem.connect(addr1).mintNFT(tokenURI_1);
    const tx2 = await marketItem.connect(addr2).mintNFT(tokenURI_2);

    expect(await marketItem.tokenURI(1)).to.equal(tokenURI_1);
    expect(await marketItem.tokenURI(2)).to.equal(tokenURI_2);

  })

  // it("NFT is approved", async function () {
  //   const { marketItem, marketPlace, owner, addr1, addr2 } = await loadFixture(mintMarketItem)
  //   const aprr = await marketItem.connect(addr1).approve(addr2.address, 1)
  //   expect(await marketItem.getApproved(1)).to.equal(addr2.address);
  // })

  it("Should emit NFT", async function () {

    const { marketItem, marketPlace, owner, addr1, addr2 } = await loadFixture(deployFixture);
    await expect(marketItem.connect(owner).mintNFT(tokenURI_1))
      .to.emit(marketItem, "NewNFTMinted")
      .withArgs(1);
  });

  it("Update market fee",async function () {
    const { marketItem, marketPlace, owner, addr1, addr2 } = await loadFixture(deployFixture);
    const tx1 = await marketPlace.connect(owner).updateMarketFee(100);
    const fee = await marketPlace.marketFee();
    assert.equal(fee.toNumber(), 100);
  });

  it("Create collection",async function () {
    const { marketItem, marketPlace, owner, addr1, addr2 } = await loadFixture(deployFixture);
    const tx1 = await marketPlace.connect(owner).createCollection("Dogs", "Dogs of the City");
    const collCount = await marketPlace.getCollectionsCount();
    assert.equal(collCount.toNumber(), 1);
    const collection = await marketPlace.collections(1);
    assert.equal(collection.name, "Dogs");
  });

  it("NFT added to market",async function () {
    const { marketItem, marketPlace, owner, addr1, addr2 } = await loadFixture(mintMarketItem);
    await marketPlace.connect(owner).createCollection("Dogs", "Dogs of the City");
    const collection = await marketPlace.collections(1);
    await marketPlace.connect(owner).addNFTItemToMarket(marketItem.address, 1, collection);
    console.log(marketPlace.marketItems(1));
  
    // await expect( await marketPlace.connect(owner).addNFTItemToMarket(marketItem.address, 1, collection))
    //   .to.emit(marketPlace, "NFTItemAction")
    //   .withArgs(marketPlace.marketItems(1));
    
  });


})