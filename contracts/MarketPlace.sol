// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./MarketItem.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";

contract MarketPlace is ReentrancyGuard, Ownable {
    uint256 public marketFee = 1 wei;

    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;
    Counters.Counter private _itemsSold;
    Counters.Counter private _collectionId;
    address payable contractOwner;
    MarketItem marketItem;

    // Bidder bidder;

    constructor() {
        contractOwner = payable(msg.sender);
    }

    struct Collection {
        string name;
        string description;
    }

    struct NFTMarketItem {
        uint256 itemId;
        Collection collection;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }

    // struct Bidder {
    //     address payable bidder;
    //     uint256 bid;
    //     NFTMarketItem nft;
    // }

    mapping(uint256 => NFTMarketItem) public marketItems;
    mapping(uint256 => bool) private isPresent;
    mapping(string => bool) private isPresentCollection;
    mapping(uint256 => Collection) public collections;
    // mapping(address => uint256) private pendingReturns;

    event NFTItemAction(NFTMarketItem);
    // event BidReceived(address bidder, uint256 amount);

    modifier isOwner(address nftAddress, uint256 tokenId) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        require(msg.sender == owner, "Not token owner.");
        _;
    }

    /////////// Market fee logic

    function updateMarketFee(uint256 newMarketFee) public onlyOwner {
        marketFee = newMarketFee;
    }

    /////////// MarketItems logic
    function getMarketItemsCount() public view returns (uint256) {
        return _itemIds.current();
    }

    function getMarketItems()
        public
        view
        returns (NFTMarketItem[] memory)
    {
        uint256 currentIndex = 0;
        NFTMarketItem[] memory items = new NFTMarketItem[](_itemIds.current());
        for (uint256 i = 1; i <= _itemIds.current(); i++) {
            
                NFTMarketItem memory currentItem = marketItems[i];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            
        }
        return items;
    }

    function getMarketItem(uint256 _id)
        public
        view
        returns (NFTMarketItem memory)
    {
        return (marketItems[_id]);
    }

    ////// Collections Logic
    function createCollection(string memory _name, string memory _description)
        external
    {
        require(!isPresentCollection[_name], "Collection name already exists");
        isPresentCollection[_name] = true;
        _collectionId.increment();
        Collection memory collection = Collection(_name, _description);
        uint256 id = _collectionId.current();
        collections[id] = collection;
    }

    function getCollectionsCount() public view returns (uint256) {
        return _collectionId.current();
    }

    function getCollections() 
    public 
    view 
    returns (Collection[] memory) {
        uint256 currentIndex = 0;
        Collection[] memory items = new Collection[](_collectionId.current());
        for (uint256 i = 1; i <= _collectionId.current(); i++) {
            
                Collection memory currentItem = collections[i];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            
        }
        return items;
    }

    function addNFTItemToMarket(
        address nftContract,
        uint256 tokenId,
        Collection memory collection
    ) public payable nonReentrant {
        require(!isPresent[tokenId], "NFT already exists on the market!");
        isPresent[tokenId] = true;

        _itemIds.increment();
        uint256 itemId = _itemIds.current();

        marketItems[itemId] = NFTMarketItem(
            itemId,
            collection,
            nftContract,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            0,
            false
        );

        emit NFTItemAction(marketItems[itemId]);
    }

    function listNFTItemToMarket(
        uint256 itemId,
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) public payable nonReentrant isOwner(nftContract, tokenId) {
        require(isPresent[tokenId], "Token not exist in the market.");
        require(price > 0, "Price should be more than 0");
        require(msg.value == marketFee, "Need to pay market fee.");

        IERC721 nft = IERC721(nftContract);

        nft.transferFrom(msg.sender, address(this), tokenId);

        marketItems[itemId].price = price;
        marketItems[itemId].owner = payable(address(this));

        emit NFTItemAction(marketItems[itemId]);
    }

    function MarketSaleNFT(uint256 itemId) public payable nonReentrant {
        uint256 price = marketItems[itemId].price;
        uint256 tokenId = marketItems[itemId].tokenId;
        console.log(msg.value);
        console.log(price);
        require(msg.value == price, "Need appropriate price.");

        marketItems[itemId].price = 0;
        marketItems[itemId].sold = true;

        marketItems[itemId].seller.transfer(msg.value);
        

        IERC721(marketItems[itemId].nftContract).transferFrom(
            payable(marketItems[itemId].owner),
            msg.sender,
            tokenId
        );

       
        marketItems[itemId].owner = payable(msg.sender);
        payable(contractOwner).transfer(marketFee);

        emit NFTItemAction(marketItems[itemId]);
    }
}
