import { utils } from "ethers";
import { useEffect, useState } from "react";
import { uploadFileToIPFS, uploadJSONToIPFS } from "../pinata";
import useMarketPlaceContract from "../hooks/useMarketPlaceContract";
import useMarketItemContract from "../hooks/useMarketItemContract";
import { useLocation } from "react-router";
import { useWeb3React } from "@web3-react/core";
import type { Web3Provider } from "@ethersproject/providers";
import { SpinnerDotted } from 'spinners-react';

type contracts = {
    marketContractAddress: string;
    itemContractAddress: string
};


interface Collection {
    name: string;
    description: string;
}

const AddItemToMarket = ({ marketContractAddress, itemContractAddress }: contracts) => {


    const { account, library } = useWeb3React<Web3Provider>();
    const [createdCollections, setCreatedCollections] = useState([]);
    const marketPlaceContract = useMarketPlaceContract(marketContractAddress);
    const marketItem = useMarketItemContract(itemContractAddress);
    const [formParams, updateFormParams] = useState({ name: '', description: '' });
    const [fileURL, setFileURL] = useState(null);
    const [tokenId, setTokenId] = useState<number | undefined>();
    const [addToMarket, setAddToMarket] = useState<number | undefined>();
    
    const [collection, setCollection] = useState<Collection | undefined>();
    const [price, setPrice] = useState<string | undefined>();
    const [message, updateMessage] = useState('');
    const [loading, setLoading] = useState(false);
    // const location = useLocation();

    useEffect(() => {
        initDropdownList();
    }, [])


    const priceSet = (input) => {
        setPrice(input.target.value)
    }

    const addTokenToMarket = (input) => {
        setAddToMarket(input.target.value)
    }

    

    const initDropdownList = async () => {

        try {
            const result = await marketPlaceContract.getCollections();
            setCreatedCollections(result);

            var select;

            select = document.getElementById("collects");
            select.onChange = handleChange
            for (var i = 0; i <= result.length; i++) {
                var option = document.createElement('option');
                option.value = option.text = result[i].name;
                console.log(i)
                select.add(option);

            }
        } catch (e) {

        }
    }

    const handleChange = (e) => {

        const filteredData = createdCollections.filter((cat) => cat.name === e.target.value)[0];

        setCollection(filteredData)

    }

    const OnChangeFile = async (e) => {
        var file = e.target.files[0];
        try {
            //upload the file to IPFS
            const response = await uploadFileToIPFS(file);
            if (response.success === true) {
                console.log("Uploaded image to Pinata: ", response.pinataURL)
                setFileURL(response.pinataURL);
            }
        }
        catch (e) {
            console.log("Error during file upload", e);
        }
    }


    //This function uploads the metadata to IPFS
    const uploadMetadataToIPFS = async (formParams, _collection, fileURL) => {
        try {
            const nftJSON = JSON.stringify({
                name: formParams.name,
                description: formParams.description,
                collection: _collection,
                image: fileURL
            });
            console.log(nftJSON)

            //upload the metadata JSON to IPFS
            const response = await uploadJSONToIPFS(nftJSON);
            if (response.success === true) {
                console.log("Uploaded JSON to Pinata: ", response)
                return response.pinataURL;
            }
        }
        catch (e) {
            console.log("error uploading JSON metadata:", e)
        }
    }


    const mintNFT = async (e) => {
        e.preventDefault();

        try {
            // console.log("Minting")

            setLoading(true);
            const metadataURL = await uploadMetadataToIPFS(formParams, collection, fileURL);
            console.log(metadataURL)
            setLoading(false);
           
            const id = await mint(metadataURL);
             
            var collectionId = createdCollections.findIndex(i => i.name == collection.name);
            await addMarket(id,collectionId);
    
        } catch (e) {

        }
    }

    const mint = async (metadataURL)=>{
        setLoading(true);
        const tx = await marketItem.mintNFT(metadataURL);
        const id = await tx.wait(1);
        console.log("Minted");
        const idTok = parseInt(id.logs[0].topics[3], 16);
        await setTokenId(idTok)
        setLoading(false);
        return idTok;
    }

    const addMarket = async(tokenId, collectionId)=>
    {
        setLoading(true);
        console.log(`Add to market place ${tokenId} ${collection} ${marketItem.address} ${marketPlaceContract.address}`);
        var transaction = await marketPlaceContract.addNFTItemToMarket(marketItem.address, tokenId, collectionId);
        await transaction.wait();
        setLoading(false);
    }

    const listNFT = async (e) => {
        e.preventDefault();

        try {

    

            var listingPrice = await marketPlaceContract.marketFee();
            // console.log(listingPrice)
            //actually create the NFT
           

            var currentId = await marketPlaceContract.getMarketItemsCount()

            // alert("Successfully added your NFT!");
            // updateMessage("");

            // const gasPriceWei = utils.parseUnits(price, 'gwei');
            // var listTransaction = await marketPlaceContract.listNFTItemToMarket(currentId, marketItem.address, tokenId, price, { value: listingPrice })
            // updateFormParams({ name: '', description: ''});
            // alert("Successfully listed your NFT!");
            // // window.location.replace("/")
        }
        catch (e) {
            alert("Upload error" + e)
        }
    }
    return (
        <div className="">

            <div className="flex flex-col place-items-center mt-10" id="nftForm">
                <form className="bg-white shadow-md rounded px-8 pt-4 pb-8 mb-4">
                    <h3 className="text-center font-bold text-purple-500 mb-8">Mint and Upload your NFT to the marketplace</h3>
                    <div className="mb-4">
                        <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="name">NFT Name</label>
                        <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="name" type="text"
                            placeholder="Name" onChange={e => updateFormParams({ ...formParams, name: e.target.value })} value={formParams.name}></input>
                    </div>
                    <div className="mb-6">
                        <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="description">NFT Description</label>
                        <textarea className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="description" type="text"
                            placeholder="Description"
                            value={formParams.description} onChange={e => updateFormParams({ ...formParams, description: e.target.value })}></textarea>
                    </div>
                    <div className="mb-6">
                        <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="collection">Collections</label>
                        <select id="collects" onChange={handleChange} ><option value="">Please select</option></select>
                    </div>
                    <div>
                        <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="image">Upload Image</label>
                        <input type={"file"} onChange={OnChangeFile}></input>
                    </div>
                    <div className="mb-4">
                        <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="price">Price</label>
                        <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="price" type="text"
                            placeholder="Price" onChange={priceSet} value={price}></input>
                    </div>
                    <br></br>
                    <div className="text-green text-center">{message}</div>

                    <button onClick={mintNFT} className="font-bold mt-10 w-full bg-purple-500 text-white rounded p-2 shadow-lg">
                        Mint NFT
                    </button>
                    <br></br>
                    {/* <div className="mb-4">
                        <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="name">Tocken Id</label>
                        <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="name" type="text"
                            placeholder="Name" onChange={addTokenToMarket} value={addToMarket}></input>
                    </div>
                    <button onClick={listNFT} className="font-bold mt-10 w-full bg-purple-500 text-white rounded p-2 shadow-lg">
                        Add NFT to Market Place
                    </button> */}
                </form>
            </div>
            <div>
                <p>Added tokens:</p>
                <div>{tokenId}</div>
                <SpinnerDotted enabled={loading} />
            </div>
        </div>
    )
};


export default AddItemToMarket;
