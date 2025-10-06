import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
export class AptosVaultExecutor {
    constructor(config) {
        const aptosConfig = new AptosConfig({
            network: Network.TESTNET,
            fullnode: config.nodeUrl || "https://fullnode.testnet.aptoslabs.com/v1"
        });
        this.aptos = new Aptos(aptosConfig);
        this.vaultAddress = config.vaultAddress;
        this.orderbookAddress = config.orderbookAddress;
        const hasPrivateKey = typeof config.privateKey === "string" && config.privateKey.trim().length > 0;
        if (hasPrivateKey) {
            const privateKey = new Ed25519PrivateKey(config.privateKey);
            this.account = Account.fromPrivateKey({ privateKey });
        }
        else {
            // Fallback to an ephemeral account for non-signing operations in dev
            console.warn("[AptosVaultExecutor] No AGENT_PRIVATE_KEY provided. Using ephemeral account; signing ops will fail.");
            this.account = Account.generate();
        }
    }
    async moveFromVaultToWallet(amount) {
        try {
            const amountInOctas = Math.floor(parseFloat(amount) * 100000000);
            const transaction = await this.aptos.transaction.build.simple({
                sender: this.account.accountAddress,
                data: {
                    function: `${this.vaultAddress}::vault::move_from_vault_to_wallet`,
                    typeArguments: [`${this.vaultAddress}::mock_token::MockToken`],
                    functionArguments: [amountInOctas.toString(), this.account.accountAddress.toString()]
                }
            });
            const committedTxn = await this.aptos.signAndSubmitTransaction({
                signer: this.account,
                transaction
            });
            const executedTxn = await this.aptos.waitForTransaction({
                transactionHash: committedTxn.hash
            });
            return {
                success: true,
                txHash: committedTxn.hash,
                amount: amount,
                message: "Assets moved from vault to wallet"
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async moveFromWalletToVault(amount, profitAmount) {
        try {
            const amountInOctas = Math.floor(parseFloat(amount) * 100000000);
            const profitInOctas = Math.floor(parseFloat(profitAmount) * 100000000);
            const transaction = await this.aptos.transaction.build.simple({
                sender: this.account.accountAddress,
                data: {
                    function: `${this.vaultAddress}::vault::move_from_wallet_to_vault`,
                    typeArguments: [`${this.vaultAddress}::mock_token::MockToken`],
                    functionArguments: [amountInOctas.toString(), profitInOctas.toString()]
                }
            });
            const committedTxn = await this.aptos.signAndSubmitTransaction({
                signer: this.account,
                transaction
            });
            await this.aptos.waitForTransaction({
                transactionHash: committedTxn.hash
            });
            return {
                success: true,
                txHash: committedTxn.hash,
                amount: amount,
                profit: profitAmount,
                message: "Assets and profits returned to vault"
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async placeLimitOrder(baseAsset, quoteAsset, price, quantity, side) {
        try {
            const priceInOctas = Math.floor(parseFloat(price) * 100000000);
            const quantityInOctas = Math.floor(parseFloat(quantity) * 100000000);
            const isBid = side === 'bid';
            const transaction = await this.aptos.transaction.build.simple({
                sender: this.account.accountAddress,
                data: {
                    function: `${this.orderbookAddress}::orderbook::place_limit_order`,
                    typeArguments: [
                        `${this.orderbookAddress}::mock_token::MockToken`,
                        "0x1::aptos_coin::AptosCoin"
                    ],
                    functionArguments: [
                        this.orderbookAddress,
                        priceInOctas.toString(),
                        quantityInOctas.toString(),
                        isBid.toString(),
                        "0"
                    ]
                }
            });
            const committedTxn = await this.aptos.signAndSubmitTransaction({
                signer: this.account,
                transaction
            });
            await this.aptos.waitForTransaction({
                transactionHash: committedTxn.hash
            });
            return {
                success: true,
                txHash: committedTxn.hash,
                price,
                quantity,
                side,
                message: "Limit order placed successfully"
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async cancelOrder(orderId, side, baseAsset, quoteAsset) {
        try {
            const transaction = await this.aptos.transaction.build.simple({
                sender: this.account.accountAddress,
                data: {
                    function: `${this.orderbookAddress}::orderbook::cancel_order`,
                    typeArguments: [
                        `${this.orderbookAddress}::mock_token::MockToken`,
                        "0x1::aptos_coin::AptosCoin"
                    ],
                    functionArguments: [this.orderbookAddress, orderId]
                }
            });
            const committedTxn = await this.aptos.signAndSubmitTransaction({
                signer: this.account,
                transaction
            });
            await this.aptos.waitForTransaction({
                transactionHash: committedTxn.hash
            });
            return {
                success: true,
                txHash: committedTxn.hash,
                orderId,
                message: "Order cancelled successfully"
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}
