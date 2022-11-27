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
    MarketItem marketItem;
    Bidder bidder;

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

    struct Bidder {
        address payable bidder;
        uint256 bid;
        NFTMarketItem nft;
    }

    mapping(uint256 => NFTMarketItem) public marketItems;
    mapping(uint256 => bool) private isPresent;
    mapping(uint256 => Collection) public collections;
    mapping(address => uint256) private pendingReturns;

    event NFTItemAction(NFTMarketItem);

    event BidReceived(address bidder, uint256 amount);

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

    function getMarketItems(uint256 _id)
        public
        view
        returns (NFTMarketItem memory)
    {
        return (marketItems[_id]);
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
        public
    {
        _collectionId.increment();
        Collection memory collection = Collection(_name, _description);
        uint256 id = _collectionId.current();
        collections[id] = collection;
    }

    function getCollectionsCount() public view returns (uint256) {
        return _collectionId.current();
    }

    // isOwner(nftContract, tokenId, msg.sender

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
        require(price > 0, "Price should be more than 0 PLZ.");
        require(msg.value == marketFee, "Need to pay market fee.");

        IERC721 nft = IERC721(nftContract);
        if (nft.getApproved(tokenId) != address(this)) {
            nft.setApprovalForAll(payable(address(this)), true);
        }

        nft.transferFrom(msg.sender, address(this), tokenId);

        marketItems[itemId].price = price;
        marketItems[itemId].owner = payable(address(this));

        emit NFTItemAction(marketItems[itemId]);
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

        emit NFTItemAction(marketItems[itemId]);
    }

    // function makeABid(address nftContract, uint256 tokenId) public payable {
    //     addNFTItemToMarket(nftContract, tokenId);

    //     if (msg.value != 0) {
    //         pendingReturns[msg.sender] = msg.value;
    //     }

    //     bidder = Bidder(
    //         payable(msg.sender),
    //         msg.value,
    //         marketItems[_itemIds.current()]
    //     );

    //     emit BidReceived(msg.sender, msg.value);
    // }

    // function acceptABit() public payable {
    //     ///////////// TODO need to think of the Accepted bid
    //     bidder.bidder.transfer(bidder.bid);
    // }

    // function refuseBit() public payable returns (bool) {
    //     ///////// TODO think on the logic here

    //     uint256 amount = pendingReturns[msg.sender];
    //     if (amount > 0) {
    //         // It is important to set this to zero because the recipient
    //         // can call this function again as part of the receiving call
    //         // before `send` returns.
    //         pendingReturns[msg.sender] = 0;

    //         if (!payable(msg.sender).send(amount)) {
    //             // No need to call throw here, just reset the amount owing
    //             pendingReturns[msg.sender] = amount;
    //             return false;
    //         }
    //     }
    //     return true;
    // }
}
