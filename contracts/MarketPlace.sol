// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./MarketItem.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";

contract MarketPlace is ReentrancyGuard, Ownable {
    uint256 marketFee = 0.0000000000000001 ether;

    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;
    Counters.Counter private _itemsSold;
    Counters.Counter private _collectionId;

    event NFTItemAction(
        uint256 indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );

    event BidReceived(address bidder, uint256 amount);

    struct Bidder {
        address payable bidder;
        uint256 bid;
        NFTMarketItem nft;
    }

    Bidder bidder;

    struct Collection {
        string name;
        string description;
    }

    struct NFTMarketItem {
        uint256 itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }

    mapping(uint256 => NFTMarketItem) private marketItems;
    mapping(uint256 => bool) private isPresent;
    mapping(uint256 => Collection) private collections;
    mapping(uint256 => uint256) private tokenIdToCollectionId;
    mapping(address => uint256) private pendingReturns;

     modifier isOwner(
        address nftAddress,
        uint256 tokenId,
        address spender
    ) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        require(spender == owner, "Not token owner.");
        _;
    }


    /////////// Market fee logic

    function updateMarketFee(uint256 newMarketFee)
        public
        payable
        onlyOwner
    {
        marketFee = newMarketFee;
    }

    function getMaketFee()
        public
        view
        returns (uint256)
    {
        return marketFee;
    }
    /////////// MarketItems logic
    function getMarketItemsCount() public view returns (uint256) {
        return _itemIds.current();
    }

    function getMarketItems(uint256 _id)
        public
        view
        returns (
            uint256,
            address,
            uint256,
            address,
            address,
            uint256,
            bool
        )
    {
        return (
            marketItems[_id].itemId,
            marketItems[_id].nftContract,
            marketItems[_id].tokenId,
            marketItems[_id].seller,
            marketItems[_id].owner,
            marketItems[_id].price,
            marketItems[_id].sold
        );
    }

    ////// Collections Logic
    function createCollection(string memory _name, string memory _description)
        public
    {
        Collection memory collection = Collection(_name, _description);
        uint256 id = _collectionId.current();
        collections[id] = collection;
    }

    function getTokenCollectionID(uint256 tokenId)
        public
        view
        returns (uint256)
    {
        return tokenIdToCollectionId[tokenId];
    }

    function addTokenToCollection(uint256 tokenId, uint256 collectionId)
        external
    {
        if (tokenIdToCollectionId[tokenId] == 0) {
            tokenIdToCollectionId[tokenId] = collectionId;
        }
    }

   
    function approve(
        address payable toBeApproved,
        address nftAddress,
        uint256 tokenId
    ) public {
        require(toBeApproved == address(this), "Not market address.");
        IERC721 nft = IERC721(nftAddress);
        nft.approve(toBeApproved, tokenId);
    }

    function addNFTItemToMarket(address nftContract, uint256 tokenId)
        public
        payable
        nonReentrant
    // isOwner(nftContract, tokenId, msg.sender)
    {
        _itemIds.increment();
        uint256 itemId = _itemIds.current();
        require(!isPresent[itemId], "NFT already added!");
        isPresent[itemId] = true;

        marketItems[itemId] = NFTMarketItem(
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            0,
            false
        );

        emit NFTItemAction(
            itemId,
            nftContract,
            tokenId,
            msg.sender,
            address(0),
            0,
            false
        );
    }

    function listNFTItemToMarket(
        uint256 itemId,
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) public payable nonReentrant isOwner(nftContract, tokenId, msg.sender) {
        require(isPresent[itemId], "Token not exist in the market.");
        require(price > 0, "Price should be more than 0 PLZ.");
        require(msg.value == marketFee, "Need to pay market fee.");

        IERC721 nft = IERC721(nftContract);
        if (nft.getApproved(tokenId) != address(this)) {
            approve(payable(address(this)), nftContract, tokenId);
        }

        marketItems[itemId].price = price;
        marketItems[itemId].owner = payable(address(this));

        emit NFTItemAction(
            itemId,
            nftContract,
            tokenId,
            msg.sender,
            address(this),
            price,
            false
        );
    }

    function MarketSaleNFT(uint256 itemId) public payable nonReentrant {
        uint256 price = marketItems[itemId].price;
        uint256 tokenId = marketItems[itemId].tokenId;
        require(msg.value == price, "Please provide appropriate price");

        marketItems[itemId].seller.transfer(msg.value);
        IERC721(marketItems[itemId].nftContract).transferFrom(
            address(this),
            msg.sender,
            tokenId
        );
        marketItems[itemId].owner = payable(msg.sender);
        marketItems[itemId].sold = true;
        _itemsSold.increment();
        payable(address(this)).transfer(marketFee);

        emit NFTItemAction(
            itemId,
            marketItems[itemId].nftContract,
            marketItems[itemId].tokenId,
            marketItems[itemId].owner,
            marketItems[itemId].seller,
            0,
            true
        );
    }

    function makeABid(address nftContract, uint256 tokenId) public payable {
        addNFTItemToMarket(nftContract, tokenId);

        if (msg.value != 0) {
            pendingReturns[msg.sender] = msg.value;
        }

        bidder = Bidder(
            payable(msg.sender),
            msg.value,
            marketItems[_itemIds.current()]
        );

        emit BidReceived(msg.sender, msg.value);
    }

    function acceptABit() public payable {
        ///////////// TODO need to think of the Accepted bid
        bidder.bidder.transfer(bidder.bid);
    }

    function refuseBit() public payable returns (bool) {
        ///////// TODO think on the logic here

        uint256 amount = pendingReturns[msg.sender];
        if (amount > 0) {
            // It is important to set this to zero because the recipient
            // can call this function again as part of the receiving call
            // before `send` returns.
            pendingReturns[msg.sender] = 0;

            if (!payable(msg.sender).send(amount)) {
                // No need to call throw here, just reset the amount owing
                pendingReturns[msg.sender] = amount;
                return false;
            }
        }
        return true;
    }
}
