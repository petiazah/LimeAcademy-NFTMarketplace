import { utils } from "ethers";
import { useEffect, useState } from "react";
import { uploadFileToIPFS, uploadJSONToIPFS } from "../pinata";
import useMarketPlaceContract from "../hooks/useMarketPlaceContract";
import useMarketItemContract from "../hooks/useMarketItemContract";
import { useLocation } from "react-router";
import { useWeb3React } from "@web3-react/core";
import type { Web3Provider } from "@ethersproject/providers";

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
    const [formParams, updateFormParams] = useState({ name: '', description: '', collection: ''});
    const [fileURL, setFileURL] = useState(null);
    const [tokenId, setTockenId] =  useState<number | undefined>();
    const [collection, setCollection] = useState<Collection | undefined>();
    const [price, setPrice] =  useState<string | undefined>();
    const [message, updateMessage] = useState('');
    // const location = useLocation();

    useEffect(() => {
        initDropdownList();
      },[])


      const priceSet = (input) => {
        setPrice(input.target.value)
      }

    const initDropdownList = async () => {

        try {
            const result: Collection[] = await marketPlaceContract.getCollections();
            setCreatedCollections(result);

            setTockenId(createdCollections.length)
            var select;
        
            select = document.getElementById( "collects" );
            select.onChange = handleChange
            for ( var i = 0; i <= 2;  i++) {
                var option = document.createElement('option');
                option.value = option.text = result[i].name;
                console.log(i)
                select.add( option );
                
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
        //check for file extension
        try {
            //upload the file to IPFS
            const response = await uploadFileToIPFS(file);
            if(response.success === true) {
                console.log("Uploaded image to Pinata: ", response.pinataURL)
                setFileURL(response.pinataURL);
            }
        }
        catch(e) {
            console.log("Error during file upload", e);
        }
      }
    
  
    //This function uploads the metadata to IPFS
    const  uploadMetadataToIPFS = async() => {
        const {name, description, collection} = formParams;
        //Make sure that none of the fields are empty
        if( !name || !description || !collection || !fileURL)
            return;

        const nftJSON = {
            name, description, collection, image: fileURL
        }

        console.log(nftJSON)

        try {
            //upload the metadata JSON to IPFS
            const response = await uploadJSONToIPFS(nftJSON);
            if(response.success === true){
                console.log("Uploaded JSON to Pinata: ", response)
                return response.pinataURL;
            }
        }
        catch(e) {
            console.log("error uploading JSON metadata:", e)
        }
    }


    const mintNFT = async(e)=>{
        e.preventDefault();

        try {
            console.log("Minting")
            const metadataURL = await uploadMetadataToIPFS();
            console.log(metadataURL)
            const tx = await marketItem.mintNFT(metadataURL);
            const id = await tx.wait(1)
            console.log("Minted")
            setTockenId(parseInt(id.logs[0].topics[3], 16))
        } catch (e) {
            
        }
    }

    const listNFT = async(e) => {
        e.preventDefault();

        try {
          
            await mintNFT;
           
        
        
            var listingPrice = await marketPlaceContract.marketFee()
            console.log(listingPrice)
            //actually create the NFT
             var transaction = await marketPlaceContract.addNFTItemToMarket(marketItem.address, tokenId, collection )
             await transaction.wait()

             var currentId = await marketPlaceContract.getMarketItemsCount()

            alert("Successfully added your NFT!");
            updateMessage("");

            const gasPriceWei = utils.parseUnits(price, 'gwei');
            var listTransaction = await marketPlaceContract.listNFTItemToMarket(currentId, marketItem.address, tokenId, price, { value: listingPrice } )
            updateFormParams({ name: '', description: '', collection: ''});
            alert("Successfully listed your NFT!");
            // window.location.replace("/")
        }
        catch(e) {
            alert( "Upload error"+e )
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
                    placeholder="Name" onChange={e => updateFormParams({...formParams, name: e.target.value})} value={formParams.name}></input>
                </div>
                <div className="mb-6">
                    <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="description">NFT Description</label>
                    <textarea className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"  id="description" type="text"
                    placeholder="Description" 
                    value={formParams.description} onChange={e => updateFormParams({...formParams, description: e.target.value})}></textarea>
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
                    Add NFT to MArket Place
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
  