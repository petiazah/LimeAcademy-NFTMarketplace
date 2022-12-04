import { utils } from "ethers";
import { useEffect, useState } from "react";
import { uploadFileToIPFS, uploadJSONToIPFS } from "../pinata";
import useMarketPlaceContract from "../hooks/useMarketPlaceContract";
import useMarketItemContract from "../hooks/useMarketItemContract";
import { useLocation } from "react-router";
import { useWeb3React } from "@web3-react/core";
import type { Web3Provider } from "@ethersproject/providers";
import { create as ipfsHttpClient } from "ipfs-http-client";
import { INFURA_ID, INFURA_SECRET_KEY } from "../constants";



const auth =
    'Basic ' + Buffer.from(INFURA_ID + ':' + INFURA_SECRET_KEY).toString('base64');
const client = ipfsHttpClient({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
        authorization: auth,
    },
});

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
    const [formParams, updateFormParams] = useState({ name: "", description: ""});
    const [fileURL, setFileURL] = useState(null);
    const [tokenId, setTockenId] = useState<number | undefined>();
    const [collection, setCollection] = useState<Collection | undefined>();
    const [price, setPrice] = useState<string | undefined>();
    const [name, setName] = useState<string | undefined>();
    const [description, setDescription] = useState<string | undefined>();
    const [message, updateMessage] = useState('');
    // const location = useLocation();

    useEffect(() => {
        initDropdownList();
    }, [])


    const priceSet = (input) => {
        setPrice(input.target.value)
    }

    const nameSet = (input) => {
        setName(input.target.value)
        updateFormParams({ ...formParams, name })
    }

    const descriptionSet = (input) => {
        setDescription(input.target.value)
        updateFormParams({ ...formParams, description })
    }

    const initDropdownList = async () => {

        try {
            const result: Collection[] = await marketPlaceContract.getCollections();
            setCreatedCollections(result);

            var select;

            select = document.getElementById("collects");
            select.onChange = handleChange
            for (var i = 0; i <= 2; i++) {
                var option = document.createElement('option');
                option.value = option.text = result[i].name;
                console.log(i)
                select.add(option);

            }
        } catch (e) {

        }
    }

    const handleChange = (e) => {

        const coll: Collection = createdCollections.filter((obj) => {
            return obj.name == e.target.value;
        });

        setCollection(coll)
      
    }

    const OnChangeFile = async (e) => {
        var file = e.target.files[0];

        try {
            const added = await client.add(file, {
                progress: (prog) => console.log("received: ${prog}"),
            });
            const url = `https://ipfs.infura.io/ipfs/${added.path}`;
            setFileURL(url);
        } catch (error) {
            console.log("Error uploading file: ", error);
        }
    }


    //This function uploads the metadata to IPFS
    const uploadMetadataToIPFS = async (formParams, collection, fileURL) => {
        try {
           
            /* first, upload to IPFS */
            const nftJSON = JSON.stringify({
                name: formParams.name,
                description: formParams.description,
                collection: collection,
                image: fileURL,
            });


            console.log(formParams.name)


            const added = await client.add(nftJSON);
            const url = `https://ipfs.infura.io/ipfs/${added.path}`;

            console.log(url)
            updateMessage(url)
            // createSale(url);
        } catch (error) {
            console.log("Error uploading file: ", error);
        }
    }


    const mintNFT = async (e) => {
        // e.preventDefault();

        try {
            console.log("Minting")
            console.log(formParams.name)
            // const metadataURL = await uploadMetadataToIPFS();
            // const result = metadataURL.await(1)
            // console.log(result)
            // const tx = await marketItem.mintNFT(metadataURL);
            // const id = await tx.wait(1)
            // console.log("Minted")
            // setTockenId(parseInt(id.logs[0].topics[3], 16))
        } catch (e) {

        }
    }

    const listNFT = async (e) => {
        e.preventDefault();

        try {

            // console.log("Minting")
            // console.log(formParams.name)
            //      /* first, upload to IPFS */
            // const nftJSON = JSON.stringify({
            //     name: formParams.name,
            //     description: formParams.description,
            //     collection: collection,
            //     image: fileURL,
            // });
            // console.log(nftJSON)
            const metadataURL = await uploadMetadataToIPFS(formParams,collection,fileURL);
          
            console.log(metadataURL)
           // const tx = await marketItem.mintNFT(metadataURL);
            // const id = await tx.wait(1)
            // console.log("Minted")
            // setTockenId(parseInt(id.logs[0].topics[3], 16))




            // var listingPrice = await marketPlaceContract.marketFee()
            // console.log(listingPrice)
            // //actually create the NFT
            //  var transaction = await marketPlaceContract.addNFTItemToMarket(marketItem.address, tokenId, collection )
            //  await transaction.wait()

            //  var currentId = await marketPlaceContract.getMarketItemsCount()

            // alert("Successfully added your NFT!");
            // updateMessage("");

            // const gasPriceWei = utils.parseUnits(price, 'gwei');
            // var listTransaction = await marketPlaceContract.listNFTItemToMarket(currentId, marketItem.address, tokenId, price, { value: listingPrice } )
            // updateFormParams({ name: '', description: '', collection: ''});
            // alert("Successfully listed your NFT!");
            // window.location.replace("/")
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
                            placeholder="Name" onChange={nameSet} value={name}></input>
                    </div>
                    <div className="mb-6">
                        <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="description">NFT Description</label>
                        <textarea className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="description" type="text"
                            placeholder="Description"
                            value={description} onChange={descriptionSet}></textarea>
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

                    <button onClick={listNFT} className="font-bold mt-10 w-full bg-purple-500 text-white rounded p-2 shadow-lg">
                        Add NFT to Market Place
                    </button>
                </form>
            </div>
            <div>
                <p>Created Collections:</p>
                <div>{tokenId}</div>
            </div>
        </div>
    )
};


export default AddItemToMarket;
