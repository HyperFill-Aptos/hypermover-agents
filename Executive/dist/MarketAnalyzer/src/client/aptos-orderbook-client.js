import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
export class AptosOrderbookClient {
    constructor(config) {
        const aptosConfig = new AptosConfig({
            network: Network.TESTNET,
            fullnode: config.nodeUrl || "https://fullnode.testnet.aptoslabs.com/v1"
        });
        this.aptos = new Aptos(aptosConfig);
        this.orderbookAddress = config.orderbookAddress;
        this.vaultAddress = config.vaultAddress;
        this.account = config.account;
    }
    static formatSymbol(baseAsset, quoteAsset) {
        return `${baseAsset}_${quoteAsset}`;
    }
    static parseSymbol(symbol) {
        const [baseAsset, quoteAsset] = symbol.split('_');
        return { baseAsset, quoteAsset };
    }
    async getOrderBook(symbol) {
        try {
            const { baseAsset, quoteAsset } = AptosOrderbookClient.parseSymbol(symbol);
            const result = await this.aptos.view({
                payload: {
                    function: `${this.orderbookAddress}::orderbook::get_order_book_depth`,
                    functionArguments: [this.orderbookAddress, "10"],
                    typeArguments: [
                        `${this.orderbookAddress}::mock_token::MockToken`,
                        "0x1::aptos_coin::AptosCoin"
                    ]
                }
            });
            const [bidPrices, bidSizes, askPrices, askSizes] = result;
            const orderbook = {
                bids: bidPrices.map((price, idx) => ({
                    price: (Number(price) / 100000000).toFixed(4),
                    quantity: (Number(bidSizes[idx]) / 100000000).toFixed(2)
                })),
                asks: askPrices.map((price, idx) => ({
                    price: (Number(price) / 100000000).toFixed(4),
                    quantity: (Number(askSizes[idx]) / 100000000).toFixed(2)
                }))
            };
            return {
                message: "Orderbook retrieved successfully",
                status_code: 200,
                orderbook
            };
        }
        catch (error) {
            return {
                message: `Error fetching orderbook: ${error.message}`,
                status_code: 500
            };
        }
    }
    async getBestBid(baseAsset, quoteAsset) {
        try {
            const result = await this.aptos.view({
                payload: {
                    function: `${this.orderbookAddress}::orderbook::get_best_bid_ask`,
                    functionArguments: [this.orderbookAddress],
                    typeArguments: [
                        `${this.orderbookAddress}::mock_token::MockToken`,
                        "0x1::aptos_coin::AptosCoin"
                    ]
                }
            });
            const [bestBid] = result;
            const bidValue = bestBid?.vec?.[0];
            return {
                message: "Best bid retrieved",
                status_code: 200,
                data: {
                    price: bidValue ? (Number(bidValue) / 100000000).toFixed(4) : "0",
                    side: "bid"
                }
            };
        }
        catch (error) {
            return {
                message: `Error fetching best bid: ${error.message}`,
                status_code: 500
            };
        }
    }
    async getBestAsk(baseAsset, quoteAsset) {
        try {
            const result = await this.aptos.view({
                payload: {
                    function: `${this.orderbookAddress}::orderbook::get_best_bid_ask`,
                    functionArguments: [this.orderbookAddress],
                    typeArguments: [
                        `${this.orderbookAddress}::mock_token::MockToken`,
                        "0x1::aptos_coin::AptosCoin"
                    ]
                }
            });
            const [, bestAsk] = result;
            const askValue = bestAsk?.vec?.[0];
            return {
                message: "Best ask retrieved",
                status_code: 200,
                data: {
                    price: askValue ? (Number(askValue) / 100000000).toFixed(4) : "0",
                    side: "ask"
                }
            };
        }
        catch (error) {
            return {
                message: `Error fetching best ask: ${error.message}`,
                status_code: 500
            };
        }
    }
    async getBestOrder(baseAsset, quoteAsset, side) {
        return side === 'bid'
            ? this.getBestBid(baseAsset, quoteAsset)
            : this.getBestAsk(baseAsset, quoteAsset);
    }
    async checkAvailableFunds(asset) {
        try {
            let balance;
            if (asset === "APT") {
                const aptBalance = await this.aptos.getAccountAPTAmount({
                    accountAddress: this.account
                });
                balance = Number(aptBalance) / 100000000;
            }
            else {
                const resource = await this.aptos.getAccountResource({
                    accountAddress: this.account,
                    resourceType: `0x1::coin::CoinStore<${this.orderbookAddress}::mock_token::MockToken>`
                });
                balance = Number(resource.coin.value) / 100000000;
            }
            return {
                message: "Funds retrieved successfully",
                status_code: 200,
                data: {
                    asset,
                    available: balance.toFixed(4),
                    locked: 0
                }
            };
        }
        catch (error) {
            return {
                message: `Error checking funds: ${error.message}`,
                status_code: 500
            };
        }
    }
    async getMarketOverview(baseAsset, quoteAsset) {
        try {
            const symbol = AptosOrderbookClient.formatSymbol(baseAsset, quoteAsset);
            const [orderbook, bestBid, bestAsk] = await Promise.all([
                this.getOrderBook(symbol),
                this.getBestBid(baseAsset, quoteAsset),
                this.getBestAsk(baseAsset, quoteAsset)
            ]);
            const bidPrice = parseFloat(bestBid.data?.price || "0");
            const askPrice = parseFloat(bestAsk.data?.price || "0");
            const spread = bidPrice && askPrice
                ? (((askPrice - bidPrice) / bidPrice) * 100).toFixed(4) + '%'
                : 'N/A';
            return {
                message: "Market overview retrieved successfully",
                status_code: 200,
                data: {
                    symbol,
                    orderbook: orderbook.orderbook,
                    bestBid: bestBid.data,
                    bestAsk: bestAsk.data,
                    spread
                }
            };
        }
        catch (error) {
            return {
                message: `Error fetching market overview: ${error.message}`,
                status_code: 500
            };
        }
    }
    async getSettlementHealth() {
        try {
            await this.aptos.getLedgerInfo();
            return {
                status: 'healthy',
                message: 'Aptos node connected',
                aptos_connected: true,
                contract_address: this.orderbookAddress
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                message: `Connection failed: ${error.message}`,
                aptos_connected: false
            };
        }
    }
}
