import { ethers } from "hardhat";
import { Contract } from "ethers";
import { IUniswapV2Pair } from "../typechain-types";


async function parseEvents(contract: Contract, filter: any, stopBlockNumber: number, argInd: number): Promise<Array<any>> {
    let blocksToParse = 2000;
    let stopBlock = stopBlockNumber;
    while (true) {
        if (blocksToParse > stopBlock / 2) {
            console.log("break")
            break;
        }
        
        // query events
        const events = await contract.queryFilter(filter, stopBlock - blocksToParse, stopBlock);

        // parse logs, filter by argInd
        const parsedEvents = events.filter((eventLog: any) => {
            const parsed = contract.interface.parseLog(eventLog);
            return parsed != null && parsed.args[argInd] != 0n
        });

        if (parsedEvents.length < 1) {
          stopBlock -= blocksToParse
          continue;
        }
        
        return parsedEvents;
    }

    return [];
}

/**
 * 
 * @param pair Uniswap V2 pair instance
 * @param stopBlock Number of the block
 * @returns True - valid pair (no comission), False - invalid pair (there is comission)
 */
export async function analyzePairBySwap(pair: IUniswapV2Pair, stopBlock: number): Promise<boolean> {
    // filters for events parsing
    const filterSwap = pair.filters.Swap;        // swap event
    const pairAddr = await pair.getAddress();
    
    // parse blocks for swap events
    const swap1Events = await parseEvents(pair, filterSwap, stopBlock, 1) // args[1] - amount0In != 0n
    const swap2Events = await parseEvents(pair, filterSwap, stopBlock, 2) // args[2] - amount1In != 0n

    if (swap1Events.length < 1 || swap2Events.length < 1) {
        return false;
    }

    // extract swap events
    const swap1 = swap1Events[swap1Events.length - 1];
    const swap2 = swap2Events[swap2Events.length - 1];

    // parse swap events
    const parsedSwap1 = pair.interface.parseLog(swap1);
    const parsedSwap2 = pair.interface.parseLog(swap2);

    // get swap transactions for finding transfer events with parameters
    // provided by swap event to ensure there is no transfers anymore while
    // swapping (token0 => token1) and (token1 => token0).
    const swap1Tx = await ethers.provider.getTransactionReceipt(swap1.transactionHash);
    const swap2Tx = await ethers.provider.getTransactionReceipt(swap2.transactionHash);

    if (swap1Tx && swap2Tx) {
        const parsedSwap1Events = swap1Tx.logs
            .map((log) => pair.interface.parseLog(log))
            .filter((log) => log != undefined && log != null);

        // find transfer events with `amount` value equals to 
        // swap1.args[token0In] OR swap1.args[token1Out]
        // and `from` or `to` address should be equal pairAddress
        const transfersInSwap1 = parsedSwap1Events.filter((log: any) => {
            return log.name == 'Transfer' && (
                log.args[2] == parsedSwap1.args[1] || log.args[2] == parsedSwap1.args[4]
            ) 
            && (
                log.args[0] == pairAddr || log.args[1] == pairAddr
            )
        });

        const parsedSwap2Events = swap2Tx.logs
            .map((log) => pair.interface.parseLog(log))  // parse events for readability
            .filter((log) => log != undefined && log != null)             // clear other events

        // find transfer events with `amount` value equals to 
        // swap2.args[token1In] OR swap2.args[token0Out]
        const transfersInSwap2 = parsedSwap2Events.filter((log: any) => {
            return log.name == 'Transfer' && (
                log.args[2] == parsedSwap2.args[2] || log.args[2] == parsedSwap2.args[3]
            ) 
            && (
                log.args[0] == pairAddr || log.args[1] == pairAddr
            )
        })

        // if transfer amounts not equals to 2 
        // then there is some transfer anomaly 
        if (transfersInSwap1.length != 2 || transfersInSwap2.length != 2) {
            return false;
        }
    } else {
        return false;
    }
    
    return true;
}