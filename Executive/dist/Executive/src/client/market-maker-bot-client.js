import axios from "axios";
export class MarketMakerBotClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    async startBot(config) {
        try {
            const response = await axios.post(`${this.baseUrl}/bot/start`, config);
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async stopBot() {
        try {
            const response = await axios.post(`${this.baseUrl}/bot/stop`);
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async getBotStatus() {
        try {
            const response = await axios.get(`${this.baseUrl}/bot/status`);
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    async modifyBotConfig(config) {
        try {
            const response = await axios.post(`${this.baseUrl}/bot/modify`, config);
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}
