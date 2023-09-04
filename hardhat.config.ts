import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import "hardhat-tracer";

// load environment variables
dotenv.config()

let eth_mainnet_url;
if (!process.env.ETH_MAINNET_HTTP) {
  throw new Error("Please set ETH_MAINNET_HTTP in the .env file")
} else {
  eth_mainnet_url = process.env.ETH_MAINNET_HTTP;
}

let bsc_mainnet_url;
if (!process.env.BSC_MAINNET_URL) {
  throw new Error("Please set BSC_MAINNET_URL in the .env file")
} else {
  bsc_mainnet_url = process.env.BSC_MAINNET_URL;
}

const config: HardhatUserConfig = {
  solidity: "0.8.19",

  networks: {
    hardhat: {
      forking: {
        url: eth_mainnet_url,
        blockNumber: 18025274
      }
    }, 

    eth: {
      url: eth_mainnet_url
    },

    bsc: {
      url: bsc_mainnet_url
    },
  }
};

export default config;
