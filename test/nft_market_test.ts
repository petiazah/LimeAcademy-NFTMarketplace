import { expect } from "chai";
import { ethers } from "hardhat";
import type { SignerWithAddress   } from "@nomiclabs/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("NFTMarket", function () {

  async function deployFixture(){
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();

    const MarketItem = await ethers.getContractFactory("MarketItem");
    const marketItem = await MarketItem.deploy();
    await marketItem.deployed();
    console.log("Petiazah NFT address:", marketItem.address);
  
    const MarketPlace = await ethers.getContractFactory("MarketPlace");
    const marketPlace = await MarketPlace.deploy();
    await marketPlace.deployed();
    console.log("MarketPlace address:", marketPlace.address);

    return { marketItem, marketPlace, owner, addr1, addr2}
  }

  it("NFT is minted successfully", async function() {

    
   const {marketItem, marketPlace, owner, addr1, addr2} = await loadFixture(deployFixture);


    expect(await marketItem.balanceOf(owner.address)).to.equal(0);
    
    const tokenURI = "ipfs://bafybeig2wxk7q4rgjzo37ps62gyalv3u7wevyrsqejaplxeet7x7ho5e3q"
    const tx = await marketItem.connect(owner).mintNFT(owner.address,tokenURI);

    expect(await marketItem.balanceOf(owner.address)).to.equal(1);
  });

  it("tokenURI is set sucessfully", async function() {
    const {marketItem, marketPlace, owner, addr1, addr2} = await loadFixture(deployFixture);

    console.log(addr1.address);
    console.log(addr2.address);

    const tokenURI_1 = "ipfs://QmUprsCe2pdn77mcfJWJZ1t84Y63yqaNq32tQoJB7hfMxK/"
    const tokenURI_2 = "ipfs://Qmd4QQPtbvaMtrV3U78xgY8hNuRMN4S3aPmugYzqikZSaF/"

    const tx1 = await marketItem.connect(owner).mintNFT(addr1.address,tokenURI_1);
    const tx2 = await marketItem.connect(owner).mintNFT(addr2.address,tokenURI_2);

    expect(await marketItem.tokenURI(1)).to.equal(tokenURI_1);
    expect(await marketItem.tokenURI(2)).to.equal(tokenURI_2);

  })

  it("tokenURI is approved", async function() {
    const {marketItem, marketPlace, owner, addr1, addr2} = await loadFixture(deployFixture);

    console.log(addr1.address);
  
    const tokenURI_1 = "ipfs://QmUprsCe2pdn77mcfJWJZ1t84Y63yqaNq32tQoJB7hfMxK/"

    const tx1 = await marketItem.connect(owner).mintNFT(addr1.address,tokenURI_1);

    const aprr = await marketItem.connect(addr1).approve(addr2.address, 1)
    

    expect(await marketItem.getApproved(1)).to.equal(addr2.address);
   

  })


})