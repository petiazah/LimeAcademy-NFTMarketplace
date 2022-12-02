import MARKETPLACE_ABI from "../contracts/MarketPlace.json";
import type {MarketPlace } from "../contracts/types";
import useContract from "./useContract";

export default function useMarketPlaceContract(contractAddress?: string) {
  return useContract<MarketPlace>(contractAddress, MARKETPLACE_ABI);
}
