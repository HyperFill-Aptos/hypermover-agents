import { AptosOrderbookClient } from "../analyzer/client/aptos-orderbook-client.js";
import { config } from "./config.js";
export class MarketManager {
    constructor() {
        this._supportedMarkets = [];
        this._marketList = [
            {
                marketName: "hypermover",
                id: "apt_usdt",
                baseAsset: "APT",
                quoteAsset: "USDT"
            }
        ];
    }
    getMarketList() {
        return this._marketList;
    }
    getMarketClient(marketName) {
        if (marketName === "hypermover") {
            return new AptosOrderbookClient({
                orderbookAddress: config.orderbookAddress,
                vaultAddress: config.vaultAddress,
                account: config.account,
                nodeUrl: config.nodeUrl
            });
        }
        return undefined;
    }
}
