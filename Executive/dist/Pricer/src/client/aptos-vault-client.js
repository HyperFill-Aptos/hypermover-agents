import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
export class AptosVaultClient {
    constructor(config) {
        const aptosConfig = new AptosConfig({
            network: Network.TESTNET,
            fullnode: config.nodeUrl || "https://fullnode.testnet.aptoslabs.com/v1"
        });
        this.aptos = new Aptos(aptosConfig);
        this.vaultAddress = config.vaultAddress;
        this.account = config.account;
    }
    async fetchVaultBalance() {
        try {
            const result = await this.aptos.view({
                payload: {
                    function: `${this.vaultAddress}::vault::get_vault_state`,
                    functionArguments: [this.vaultAddress],
                    typeArguments: [`${this.vaultAddress}::mock_token::MockToken`]
                }
            });
            const [vaultBalance, totalAssets, totalSupply, sharePrice, accumulatedFees] = result;
            return {
                vaultBalance: (Number(vaultBalance) / 100000000).toFixed(4),
                totalAssets: (Number(totalAssets) / 100000000).toFixed(4),
                totalSupply: (Number(totalSupply) / 100000000).toFixed(4),
                sharePrice: (Number(sharePrice) / 1000000).toFixed(4),
                accumulatedFees: (Number(accumulatedFees) / 100000000).toFixed(4)
            };
        }
        catch (error) {
            throw new Error(`Failed to fetch vault balance: ${error.message}`);
        }
    }
    async fetchOraclePrice(baseAsset, quoteAsset) {
        try {
            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=aptos&vs_currencies=usd`);
            const data = await response.json();
            return {
                baseAsset,
                quoteAsset,
                price: data.aptos?.usd || 12.5,
                source: "coingecko",
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            return {
                baseAsset,
                quoteAsset,
                price: 12.5,
                source: "fallback",
                timestamp: new Date().toISOString()
            };
        }
    }
    async getAvailableAssets() {
        try {
            const result = await this.aptos.view({
                payload: {
                    function: `${this.vaultAddress}::vault::get_available_assets`,
                    functionArguments: [this.vaultAddress],
                    typeArguments: [`${this.vaultAddress}::mock_token::MockToken`]
                }
            });
            return {
                availableAssets: (Number(result[0]) / 100000000).toFixed(4)
            };
        }
        catch (error) {
            throw new Error(`Failed to get available assets: ${error.message}`);
        }
    }
    async getUserShareBalance(userAddress) {
        try {
            const result = await this.aptos.view({
                payload: {
                    function: `${this.vaultAddress}::vault::get_user_share_balance`,
                    functionArguments: [this.vaultAddress, userAddress],
                    typeArguments: [`${this.vaultAddress}::mock_token::MockToken`]
                }
            });
            return {
                userAddress,
                shareBalance: (Number(result[0]) / 100000000).toFixed(4)
            };
        }
        catch (error) {
            throw new Error(`Failed to get user share balance: ${error.message}`);
        }
    }
}
