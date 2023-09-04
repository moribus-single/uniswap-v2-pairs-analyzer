import { ethers } from "hardhat";

import {analyzePairBySwap} from "./analyzePairBySwap"
import config from "../config"


async function main() {
  // get Uniswap V2 Factory address from config
  const factoryAddress = config.eth.factory

  // get Uniswap V2 Factory instance
  const uniV2Factory = await ethers.getContractAt("IUniswapV2Factory", factoryAddress);

  // get current block number
  const currBlock = await ethers.provider.getBlockNumber();
  
  // get uniswap v2 pairs amount
  const pairsLength = await uniV2Factory.allPairsLength();
  console.log("pairsLength =", pairsLength, "\n")
  for (var i = 0; i < pairsLength; i++) {
    // get pair
    const pairAddr = await uniV2Factory.allPairs(i);
    const pair = await ethers.getContractAt("IUniswapV2Pair", pairAddr);

    const result = await analyzePairBySwap(pair, currBlock)
    console.log(`Pair #${i} is ${result}\n`);
  }
}


main().catch((error) => {
  console.log(error)
});
