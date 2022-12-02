import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import marketPlaceContract from "../hooks/useMarketPlaceContract";

type MarketPlaceContract = {
    contractAddress: string;
  };

  const MarketPlace = ({ contractAddress }: MarketPlaceContract) => {
  
  }