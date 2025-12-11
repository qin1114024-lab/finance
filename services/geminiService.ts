import { GoogleGenAI, Type } from "@google/genai";
import { StockHolding } from "../types";

const API_KEY = process.env.API_KEY || '';

// Initialize the client safely
const createClient = () => {
  if (!API_KEY) {
    console.warn("Gemini API Key is missing. AI features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey: API_KEY });
};

export const updateStockPrices = async (holdings: StockHolding[]): Promise<Partial<StockHolding>[]> => {
  const ai = createClient();
  if (!ai || holdings.length === 0) return [];

  const symbols = holdings.map(h => h.symbol).join(', ');
  
  const prompt = `
    I have a portfolio with these stock symbols: ${symbols}.
    Please provide the current approximate market price (in the currency usually associated with the stock, e.g., TWD for Taiwan stocks, USD for US stocks) for each.
    If you cannot get the exact real-time price, provide a reasonable estimate based on the last closing price you know.
    
    Return a JSON array where each object contains:
    - "symbol": The stock symbol matched exactly
    - "currentPrice": The number value of the price
    - "name": A short display name for the stock
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              symbol: { type: Type.STRING },
              currentPrice: { type: Type.NUMBER },
              name: { type: Type.STRING },
            },
            required: ["symbol", "currentPrice", "name"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const data = JSON.parse(text);
    return data;

  } catch (error) {
    console.error("Failed to update stock prices via Gemini:", error);
    return [];
  }
};

export const generateFinancialAdvice = async (
  netWorth: number, 
  expenses: number, 
  topExpenseCategory: string
): Promise<string> => {
  const ai = createClient();
  if (!ai) return "請配置 API Key 以獲取 AI 財務建議。";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        作為一位專業的財務顧問，請根據以下數據給出一句簡短的鼓勵或建議（繁體中文）：
        總資產淨值: ${netWorth}
        本月總支出: ${expenses}
        最高支出類別: ${topExpenseCategory}
        
        請保持語氣專業且友善，不超過 50 個字。
      `
    });
    return response.text || "持續保持良好的記帳習慣！";
  } catch (e) {
    return "暫時無法獲取建議。";
  }
};
