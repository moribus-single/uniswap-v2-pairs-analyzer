import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { IUniswapV2Factory, IUniswapV2Router02, IUniswapV2Pair, Token } from "../typechain-types";

import config from "../config";
import {analyzePairBySwap} from "../scripts/analyzePairBySwap"

describe("Test unitily for analyzing uniswap pairs [RESULT=FALSE]", function () {
  // signers
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;

  // contracts
  let uniV2Factory: IUniswapV2Factory; 
  let uniV2Router: IUniswapV2Router02;
  let pair: IUniswapV2Pair;
  let tokenA: Token;
  let tokenB: Token;

  before(async () => {
    const factoryAddress = config.eth.factory;
    const routerAddress = config.eth.router;

    // get Uniswap V2 Factory instance
    uniV2Factory = await ethers.getContractAt("IUniswapV2Factory", factoryAddress);
    uniV2Router = await ethers.getContractAt("IUniswapV2Router02", routerAddress);

    // deploy tokens
    const tokenFactory = await ethers.getContractFactory("Token");
    tokenA = await tokenFactory.deploy("Token0", "T0", 10); // 1% comission
    tokenB = await tokenFactory.deploy("Token1", "T1", 1000); // 0% comission

    // get signers
    [ owner, user1, user2 ] = await ethers.getSigners();

    // mint some tokens
    const tokenAmountA = ethers.parseEther("1000000");
    const tokenAmountB = ethers.parseEther("1000000")
    await tokenA.mint(await owner.getAddress(), tokenAmountA);
    await tokenB.mint(await owner.getAddress(), tokenAmountB);

    // approve tokens
    await tokenA.approve(await uniV2Router.getAddress(), ethers.MaxUint256);
    await tokenB.approve(await uniV2Router.getAddress(), ethers.MaxUint256);
  });

  it("ensure comission is works", async () => {
    // ensure comission is works
    await expect(
      tokenA.transfer(await user1.getAddress(), 100)
    ).changeTokenBalance(
      tokenA, user1, 99
    );

    await tokenA.approve(await user2.getAddress(), ethers.MaxUint256);
    await expect(
      tokenA.connect(user2).transferFrom(
        await owner.getAddress(), 
        await user2.getAddress(), 
        100
      )
    ).changeTokenBalance(
      tokenA, await user2.getAddress(), 99
    );
  });

  it("create pair in uniswap v2", async () => {
    // create pair
    await expect(
      uniV2Factory.createPair(
        await tokenA.getAddress(), 
        await tokenB.getAddress()
      )
    ).not.reverted;
    
    // get pair instance
    const pairAddr = await uniV2Factory.getPair(
      await tokenA.getAddress(),
      await tokenB.getAddress()
    );
    pair = await ethers.getContractAt("IUniswapV2Pair", pairAddr);
  });

  it("adding liquidity", async () => {
    // set pair as whitelist for adding liquidity
    const pairAddr = await pair.getAddress()

    await tokenA.setWhitelist(pairAddr, true);
    await tokenA.setWhitelist(await uniV2Router.getAddress(), true);

    // add liquidity
    await expect(
      uniV2Router.addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        ethers.parseEther("1000"),
        ethers.parseEther("1000"),
        0,
        0,
        await owner.getAddress(),
        (await ethers.provider.getBlock('latest'))?.timestamp + 1000
      )
    ).not.reverted;
  });

  it("swap tokens", async () => {
    await expect(
      uniV2Router.swapExactTokensForTokens(
        ethers.parseEther("1"),
        0,
        [
          await tokenB.getAddress(),
          await tokenA.getAddress(),
        ],
        owner.address,
        (await ethers.provider.getBlock('latest'))?.timestamp + 1000
      )
    ).not.reverted;

    await expect(
      uniV2Router.swapExactTokensForTokens(
        ethers.parseEther("2"),
        0,
        [
          await tokenA.getAddress(),
          await tokenB.getAddress(),
        ],
        owner.address,
        (await ethers.provider.getBlock('latest'))?.timestamp + 1000
      )
    ).not.reverted;
  });

  it("ensure utility detect comission and return FALSE", async function () {
    // ANALYZING
    const result = await analyzePairBySwap(
      pair,
      await ethers.provider.getBlockNumber()
    );

    expect(result).false;
  });
});

describe("Test unitily for analyzing uniswap pairs [RESULT=TRUE]", function () {
  // signers
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;

  // contracts
  let uniV2Factory: IUniswapV2Factory; 
  let uniV2Router: IUniswapV2Router02;
  let pair: IUniswapV2Pair;
  let tokenA: Token;
  let tokenB: Token;

  before(async () => {
    const factoryAddress = config.eth.factory;
    const routerAddress = config.eth.router;

    // get Uniswap V2 Factory instance
    uniV2Factory = await ethers.getContractAt("IUniswapV2Factory", factoryAddress);
    uniV2Router = await ethers.getContractAt("IUniswapV2Router02", routerAddress);

    // deploy tokens
    const tokenFactory = await ethers.getContractFactory("Token");
    tokenA = await tokenFactory.deploy("Token0", "T0", 1000); // 0% comission
    tokenB = await tokenFactory.deploy("Token1", "T1", 1000); // 0% comission

    // get signers
    [ owner, user1, user2 ] = await ethers.getSigners();

    // mint some tokens
    const tokenAmountA = ethers.parseEther("1000000");
    const tokenAmountB = ethers.parseEther("1000000")
    await tokenA.mint(await owner.getAddress(), tokenAmountA);
    await tokenB.mint(await owner.getAddress(), tokenAmountB);

    // approve tokens
    await tokenA.approve(await uniV2Router.getAddress(), ethers.MaxUint256);
    await tokenB.approve(await uniV2Router.getAddress(), ethers.MaxUint256);
  });

  it("ensure there is no comission", async () => {
    // ensure comission is works
    await expect(
      tokenA.transfer(await user1.getAddress(), 100)
    ).changeTokenBalance(
      tokenA, user1, 100
    );

    await tokenA.approve(await user2.getAddress(), ethers.MaxUint256);
    await expect(
      tokenA.connect(user2).transferFrom(
        await owner.getAddress(), 
        await user2.getAddress(), 
        100
      )
    ).changeTokenBalance(
      tokenA, await user2.getAddress(), 100
    );
  });

  it("create pair in uniswap v2", async () => {
    // create pair
    await expect(
      uniV2Factory.createPair(
        await tokenA.getAddress(), 
        await tokenB.getAddress()
      )
    ).not.reverted;
    
    // get pair instance
    const pairAddr = await uniV2Factory.getPair(
      await tokenA.getAddress(),
      await tokenB.getAddress()
    );

    pair = await ethers.getContractAt("IUniswapV2Pair", pairAddr);
  });

  it("adding liquidity", async () => {
    // set pair as whitelist for adding liquidity
    const pairAddr = await pair.getAddress()

    await tokenA.setWhitelist(pairAddr, true);
    await tokenA.setWhitelist(await uniV2Router.getAddress(), true);

    // add liquidity
    await expect(
      uniV2Router.addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        ethers.parseEther("1000"),
        ethers.parseEther("1000"),
        0,
        0,
        await owner.getAddress(),
        (await ethers.provider.getBlock('latest'))?.timestamp + 1000
      )
    ).not.reverted;
  });

  it("swap tokens", async () => {
    await expect(
      uniV2Router.swapExactTokensForTokens(
        ethers.parseEther("1"),
        0,
        [
          await tokenB.getAddress(),
          await tokenA.getAddress(),
        ],
        owner.address,
        (await ethers.provider.getBlock('latest'))?.timestamp + 1000
      )
    ).not.reverted;

    await expect(
      uniV2Router.swapExactTokensForTokens(
        ethers.parseEther("2"),
        0,
        [
          await tokenA.getAddress(),
          await tokenB.getAddress(),
        ],
        owner.address,
        (await ethers.provider.getBlock('latest'))?.timestamp + 1000
      )
    ).not.reverted;
  });

  it("ensure utility detect there is no comission and return true", async function () {
    // ANALYZING
    const result = await analyzePairBySwap(
      pair,
      await ethers.provider.getBlockNumber()
    );

    expect(result).true;
  });
});
