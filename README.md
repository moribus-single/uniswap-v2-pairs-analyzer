# Tool for analyzing uniswap V2 pairs
Utility for detecting comission in Uniswap V2 pool tokens by parsing events with **Ethers.js**. You can find it in the `scripts/analyzePairBySwap.ts` file. Moreover, there is a example script how to use this utility in `scripts/analyzeUniswapV2Pairs.ts`.

## How it works?
At the heart of this tool are two key events: **Swap** events emitted by Uniswap V2 pair contracts and **Transfer** events associated with some ERC20 tokens. The signatures for these events are as follows: <br>
- `Swap(address,uint256,uint256,uint256,uint256,address)` <br>
- `Transfer(address,address,uint256)` <br>

The following is a step-by-step description of how this tool works:

1. **Fetching Swap events:** Every Uniswap V2 pair contract emits a *Swap* event for each swap that occurs. Our tool fetches at least two of these swap events, specifically tracking swaps between token0 and token1, as well as vice versa.
2. **Accessing Transaction Logs:** For each *Swap* event, we retrieve the transaction hash to access the associated transaction logs.
3. **Searching Transfer events:** Within these transaction logs, we search for two critical *Transfer* events. These events should have the same parameters as the corresponding Swap event, representing the *amountIn* and *amountOut*.
4. **Detecting comision:** If we successfully find both of these *Transfer* events with *matching values* to those in the Swap event, it means that the pair has no commissions. In this case, the function returns True, indicating that the pair is valid. Opposite, if there is a missing or mismatched Transfer event, it implies the presence of a commission in the pair, leading to a return value of False.

## Testing
There is some tests with Uniswap V2 pairs deployed localy. <br>
Run the tests:
`npx hardhat test test/localPairs.ts`

## Usage
1. Clone the repository and run `npm i` for installing all the dependencies.
2. Add environment variables in `.env` file according `.env.example` file.
3. Compile the contracts with `npx hardhat compile`.
4. Run the tests with `npx hardhat test test/localPairs.ts`.
5. Explore the script in `scripts/analyzeUniswapV2Pairs.ts` for example how to use utility.