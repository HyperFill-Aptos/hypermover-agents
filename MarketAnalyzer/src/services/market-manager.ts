import { AptosOrderbookClient } from "../client/aptos-orderbook-client.js";
import { config } from "./config.js";

export class MarketManager {
    private _supportedMarkets: any[];
    private _marketList: any[];

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

    getMarketClient(marketName: string): AptosOrderbookClient | undefined {
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
