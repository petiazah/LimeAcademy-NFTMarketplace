import { useWeb3React } from "@web3-react/core";
import Head from "next/head";
import Link from "next/link";
import Account from "../components/Account";
import AddItemToMarket from "../components/AddItemToMarket";
import CreateCollection from "../components/CreateCollection";
import MintNFT from "../components/MintNFT";
import NativeCurrencyBalance from "../components/NativeCurrencyBalance";
import TokenBalance from "../components/TokenBalance";
import { ALBT_TOKEN_ADDRESS, MARKET_PLACE_ADDRESS, PETIAZAH_NFT_ADDRESS, US_ELECTION_ADDRESS } from "../constants";
import useEagerConnect from "../hooks/useEagerConnect";

function Home() {
  const { account, library } = useWeb3React();

  const triedToEagerConnect = useEagerConnect();

  const isConnected = typeof account === "string" && !!library;

  return (
    <div>
      <Head>
        <title>LimeAcademy-boilerplate</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header>
        <nav>

          <Link href="/collections">
            <a>Collections</a>
          </Link>

          <Account triedToEagerConnect={triedToEagerConnect} />
        </nav>
      </header>

      <main>
      <h1>
         This is NFT Market Place
        </h1>
        <h2>
         You can use this marketplace to create, buy and sell NFTs
        </h2>
        <div>Connect your wallet</div>

        {isConnected && (
          <section>
            <NativeCurrencyBalance />

            <TokenBalance tokenAddress={ALBT_TOKEN_ADDRESS} symbol="ALBT" />
            {/* <CreateCollection marketContractAddress={MARKET_PLACE_ADDRESS} /> */}
            <AddItemToMarket marketContractAddress={MARKET_PLACE_ADDRESS} itemContractAddress = {PETIAZAH_NFT_ADDRESS}></AddItemToMarket>
           
          </section>
        )}
      </main>

      <style jsx>{`
        nav {
          display: flex;
          justify-content: space-between;
          
        }

        main {
          text-align: center;
        }
      `}</style>
    </div>
  );
}

export default Home;
