import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import marketItemContract from "../hooks/useMarketItemContract";


type MarketItemContract = {
    contractAddress: string;
  };

const MarketItem = ({ contractAddress }: MarketItemContract) => {
  
}