import { useEffect, useState } from "react";
import useMarketPlaceContract from "../hooks/useMarketPlaceContract";
import { useWeb3React } from "@web3-react/core";
import type { Web3Provider } from "@ethersproject/providers";
import { SpinnerDotted } from 'spinners-react';

type marketPlaceContract = {
    marketContractAddress: string;
};


interface Collection {
    name: string;
    description: string;
  }

const CreateCollection = ({ marketContractAddress }: marketPlaceContract) => {

const { account, library } = useWeb3React<Web3Provider>();
const [loading, setLoading] = useState(false);
const [error,setError] = useState<string | undefined>();
const marketPlaceContract = useMarketPlaceContract(marketContractAddress);
  const [colectionName, setColectionName] = useState<string | undefined>();
  const [createdCollections, setCreatedCollections] = useState<Collection[] | undefined>();
  const [colectionDescription, setColectionDescription] = useState<string | undefined>();

  const nameInput = (input) => {
    setColectionName(input.target.value)
  }

  const descriptionInput = (input) => {
    setColectionDescription(input.target.value)
  }

  const submitCollection = async () => {
    try {
      setLoading(true);
      
      const tx = await marketPlaceContract.createCollection(colectionName, colectionDescription);
      await tx.wait();

      setLoading(false);
      resetForm();
    } catch (error) {
     setError( "submitCollection" + error.message)
    }
    
  }




  const getCollections = async () => {
    try {
      setLoading(true);
      
      const result: Collection[] = await marketPlaceContract.getCollections();
      setCreatedCollections(result);
      setLoading(false);
      resetForm();
    } catch (error) {
     setError( "submitCollection" + error.message)
    }
    
  }

  const resetForm = async () => {
    setColectionName('');
    setColectionDescription('');
  }

return (
    <div className="results-form">
    <p>"Collection"</p>
   
    <form>
      <label>
        Collection name:
        <input onChange={nameInput} value={colectionName} type="text" name="colectionName" />
      </label>
      <br />
      <label>
        Collection description:
        <input onChange={descriptionInput} value={colectionDescription} type="text" name="collectionDescription" />
      </label>
    </form>
    <div className="button-wrapper">
      <button onClick={submitCollection}>Create Collection</button>
    </div>
    <div className="button-wrapper">
      <button onClick={getCollections}>Get Collections</button>
    </div>
    <div>{error}</div>
    <SpinnerDotted enabled={loading} />
    <div>
        <p>Created Collections:</p>
        <div>{createdCollections}</div>
    </div>
    <style jsx>{`
        .results-form {
          display: flex;
          flex-direction: column;
        }

        .button-wrapper {
          margin: 20px;
        }
        
      `}</style>
    </div>
);
}

export default CreateCollection;
