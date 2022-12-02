import Navbar from "./Navbar";
import { useState } from "react";
import { uploadFileToIPFS, uploadJSONToIPFS } from "../pinata";
import useMarketPlaceContract from "../hooks/useMarketPlaceContract";
import { useLocation } from "react-router";
import { useWeb3React } from "@web3-react/core";

type marketPlaceContract = {
    contractAddress: string;
};

const MintNFT = ({ contractAddress }: marketPlaceContract) => {


    const { account, library } = useWeb3React<Web3Provider>();
    const marketPlaceContract = useMarketPlaceContract(contractAddress);
    const [formParams, updateFormParams] = useState({ name: '', description: '', collection: ''});
    const [fileURL, setFileURL] = useState(null);

    const [message, updateMessage] = useState('');
    const location = useLocation();

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

    const listNFT = async(e) => {
        e.preventDefault();

        //Upload data to IPFS
        try {
            const metadataURL = await uploadMetadataToIPFS();
            // //After adding your Hardhat network to your metamask, this code will get providers and signers
            // const provider = new ethers.providers.Web3Provider(window.ethereum);
            // const signer = provider.getSigner();
            // updateMessage("Please wait.. uploading (upto 5 mins)")

            // //Pull the deployed contract instance
            // let contract = new ethers.Contract(Marketplace.address, Marketplace.abi, signer)

            //massage the params to be sent to the create NFT request
            // const price = ethers.utils.parseUnits(formParams.price, 'ether')
            var listingPrice = await marketPlaceContract.marketFee()
           
            //actually create the NFT
            let transaction = await contract.createToken(metadataURL, price, { value: listingPrice.toString() })
            await transaction.wait()

            alert("Successfully listed your NFT!");
            updateMessage("");
            updateFormParams({ name: '', description: '', price: ''});
            window.location.replace("/")
        }
        catch(e) {
            alert( "Upload error"+e )
        }
    }

};

  
export default MintNFT;
  