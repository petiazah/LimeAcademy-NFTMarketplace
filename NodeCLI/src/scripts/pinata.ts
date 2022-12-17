require('dotenv').config();
const fs = require('fs');

const REACT_APP_PINATA_KEY = process.env.REACT_APP_PINATA_KEY;
if (!REACT_APP_PINATA_KEY) {
    throw new Error("Please set your REACT_APP_PINATA_KEY in a .env file");
}

const REACT_APP_PINATA_SECRET = process.env.REACT_APP_PINATA_SECRET;
if (!REACT_APP_PINATA_SECRET) {
    throw new Error("Please set your REACT_APP_PINATA_SECRET in a .env file");
}


const axios = require('axios');
const FormData = require('form-data');


export const uploadJSONToIPFS = async(JSONBody:any) => {
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
    //making axios POST request to Pinata ⬇️
    return axios 
        .post(url, JSONBody, {
            headers: {
                'Content-Type': 'application/json',
                pinata_api_key: REACT_APP_PINATA_KEY,
                pinata_secret_api_key: REACT_APP_PINATA_SECRET,
            },
            body: JSONBody
        })
        .then(function (response:any) {
           return {
               success: true,
               pinataURL: "https://gateway.pinata.cloud/ipfs/" + response.data.IpfsHash,
               
           };
           
        })
        .catch(function (error:any) {
            console.log(error)
            return {
                success: false,
                message: error.message,
            }

    });
};



export const uploadFileToIPFS = async(file: any) => {


    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    //making axios POST request to Pinata ⬇️
    const readableStreamForFile = fs.createReadStream(file);
    let data = new FormData();
    data.append('file', readableStreamForFile);

    const metadata = JSON.stringify({
        name: 'testname',
        keyvalues: {
            exampleKey: 'exampleValue'
        }
    });
    data.append('pinataMetadata', metadata);

    //pinataOptions are optional
    const pinataOptions = JSON.stringify({
        cidVersion: 0,
        customPinPolicy: {
            regions: [
                {
                    id: 'FRA1',
                    desiredReplicationCount: 1
                },
                {
                    id: 'NYC1',
                    desiredReplicationCount: 2
                }
            ]
        }
    });
    data.append('pinataOptions', pinataOptions);

    return axios 
        .post(url, data, {
            maxBodyLength: 'Infinity',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
                pinata_api_key: REACT_APP_PINATA_KEY,
                pinata_secret_api_key: REACT_APP_PINATA_SECRET,
            }
        })
        .then(function (response: any) {
            console.log("image uploaded", response.data.IpfsHash)
            return {
               success: true,
               pinataURL: "https://gateway.pinata.cloud/ipfs/" + response.data.IpfsHash
           };
        })
        .catch(function (error: any) {
            console.log(error)
            return {
                success: false,
                message: error.message,
            }

    });
};


 //This function uploads the metadata to IPFS
 export const uploadMetadataToIPFS = async(formParams: { name: any; description: any; }, _collection: any, fileURL: string) => 
  {
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