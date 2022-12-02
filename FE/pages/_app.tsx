import { Web3ReactProvider } from "@web3-react/core";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import getLibrary from "../getLibrary";
import "../styles/globals.css";

function NextWeb3App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <Component {...pageProps} />
    </Web3ReactProvider>
  );
}

export default NextWeb3App;
