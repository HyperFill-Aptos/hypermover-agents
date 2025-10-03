import axios from "axios";

export interface BotConfig {
  baseAsset: string;
  quoteAsset: string;
  spreadPercentage: number;
  orderQuantity: number;
  referencePrice?: number;
}

export class MarketMakerBotClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async startBot(config: BotConfig): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/bot/start`, config);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async stopBot(): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/bot/stop`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getBotStatus(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/bot/status`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async modifyBotConfig(config: Partial<BotConfig>): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/bot/modify`, config);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
