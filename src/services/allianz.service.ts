import fetch from "node-fetch";

const BASE_URL = process.env.ALLIANZ_API_BASE_URL || "";
const TOKEN_ENDPOINT = process.env.ALLIANZ_TOKEN_ENDPOINT || "";
const USERNAME = process.env.ALLIANZ_USERNAME || "";
const PASSWORD = process.env.ALLIANZ_PASSWORD || "";
const MEDIADOR = process.env.ALLIANZ_API_MEDIADOR || "";
const PARCEIRO = process.env.ALLIANZ_API_PARCEIRO || "";
const USUARIO = process.env.ALLIANZ_API_USUARIO || "";

export interface AllianzQuotePayload {
  assistanceType: number;
  guaranteeType: number;
  insuranceType: number;
  initialDateInsurance: string; // ddMMyyyy
  isopainel: string; // "S" | "N"
  congenereId?: string;
  apoliceNumber?: string;
  paymentData: {
    capDiscount?: number;
    commission?: number;
    commissionAntecipation?: string; // "S" | "N"
    injury?: number;
    paymentMode?: number; // 0 listar meios, >0 cotar
    paymentOption?: number;
  };
  riskCategoryData: {
    buyerType: number;
    propertyUse: number;
    typeConstruction: number;
    activityType: number;
  };
  partnerData?: Record<string, string | undefined>;
  riskDataAddress?: Record<string, any>;
  listCoverage: Array<{ code: string; sumInsured: number }>;
}

export interface AllianzQuoteResponse {
  externalQuoteId?: string;
  premiumTotal?: number;
  paymentOptions?: any;
  raw?: any;
}

export class AllianzService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(
    private baseUrl: string = BASE_URL,
    private tokenEndpoint: string = TOKEN_ENDPOINT,
    private username: string = USERNAME,
    private password: string = PASSWORD,
    private mediador: string = MEDIADOR,
    private parceiro: string = PARCEIRO,
    private usuario: string = USUARIO
  ) {}

  private async getAccessToken(): Promise<string> {
    // Retorna token em cache se ainda válido
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (!this.tokenEndpoint || !this.username || !this.password) {
      throw new Error("Missing OAuth credentials");
    }

    // Autenticação Basic com username:password
    const auth = Buffer.from(`${this.username}:${this.password}`).toString("base64");

    console.log("=== OAUTH TOKEN REQUEST ===");
    console.log("Endpoint:", this.tokenEndpoint);
    console.log("Username:", this.username);
    console.log("Auth header:", "Basic " + auth.substring(0, 20) + "...");
    console.log("==========================");

    const res = await fetch(this.tokenEndpoint, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("=== OAUTH ERROR ===");
      console.error("Status:", res.status);
      console.error("Error:", errorText);
      console.error("===================");
      throw new Error(`Failed to get access token: ${res.status} - ${errorText}`);
    }

    const data: any = await res.json();
    this.accessToken = data.access_token;
    // Expira em 3600s (1h) por padrão, renovar 5min antes
    this.tokenExpiry = Date.now() + (data.expires_in || 3600) * 1000 - 300000;

    console.log("=== OAUTH SUCCESS ===");
    console.log("Token obtained:", this.accessToken ? this.accessToken.substring(0, 30) + "..." : "NONE");
    console.log("Expires in:", data.expires_in, "seconds");
    console.log("====================");

    return this.accessToken!;
  }

  async quote(payload: AllianzQuotePayload): Promise<AllianzQuoteResponse> {
    // Mock mode for local testing without Allianz API
    const mockMode = process.env.ALLIANZ_MOCK_MODE === "true";
    if (mockMode) {
      console.log("=== ALLIANZ MOCK MODE ===");
      console.log("Payload received:", JSON.stringify(payload, null, 2));
      // Build a mock plan summary based on requested coverages
      // Map numeric/string codes to full Portuguese coverage names
      const coverageByCode: Record<number, string> = {
        1: "Incêndio, raio, explosão, fumaça e queda de aeronave",
        2: "Danos elétricos",
        3: "Responsabilidade civil familiar",
        4: "Vendaval, furacão, ciclone, tornado e granizo",
        5: "Perda e pagamento de aluguel",
        6: "Roubo e furto qualificado de bens",
        7: "Quebra de vidros, mármores e granitos",
        8: "Impacto de veículos",
        9: "Danos morais",
        10: "Desmoronamento",
        11: "Acidentes pessoais",
        12: "Despesas extraordinárias",
        13: "Ruptura de tubulações",
        14: "Despesas de recompensa de documentos",
        15: "Equipamentos eletrônicos",
        16: "Roubo e furto qualificado de bens fora do local segurado",
        17: "Ruptura de tanques e tubulações",
        18: "Tumultos, greves e lockouts",
        20: "Jóias e obras de arte",
      };
      const legacyByKey: Record<string, string> = {
        INCENDIO: "Incêndio, raio, explosão, fumaça e queda de aeronave",
        DANOS_ELETRICOS: "Danos elétricos",
        RESPONSABILIDADE_CIVIL: "Responsabilidade civil familiar",
        VENDAVAL_FURACAO: "Vendaval, furacão, ciclone, tornado e granizo",
        ASSISTENCIA_24H: "Assistência 24h",
        ROUBO: "Roubo e furto qualificado de bens",
      };
      const planSummary = (payload.listCoverage || []).map((c) => {
        const codeNum = typeof c.code === "string" ? parseInt(c.code, 10) : (c.code as unknown as number);
        const name = coverageByCode[codeNum] || legacyByKey[String(c.code)] || String(c.code);
        return { name, sumInsured: c.sumInsured };
      });
      // Ensure Incêndio (code 1) is always included as mandatory coverage
      const hasIncendio = planSummary.some((item) => item.name === coverageByCode[1]);
      if (!hasIncendio) {
        planSummary.unshift({ name: coverageByCode[1], sumInsured: 0 });
      }
      // Add assistance tier if present in partnerData or paymentData flags
      planSummary.push({ name: "Assistência 24h", sumInsured: 0 });
      // If requesting payment options
      if (payload.paymentData?.paymentMode === 0) {
        return {
          paymentOptions: [
            {
              code: "CREDIT_CARD",
              name: "Cartão de Crédito",
              installments: [
                { number: 1, value: 1200.0, totalValue: 1200.0 },
                { number: 2, value: 610.0, totalValue: 1220.0 },
                { number: 3, value: 410.0, totalValue: 1230.0 },
                { number: 6, value: 210.0, totalValue: 1260.0 },
                { number: 12, value: 110.0, totalValue: 1320.0 },
              ],
            },
            {
              code: "BANK_SLIP",
              name: "Boleto Bancário",
              installments: [{ number: 1, value: 1150.0, totalValue: 1150.0 }],
            },
          ],
          raw: { mock: true, message: "Mock payment options", planSummary },
        };
      }
      // Otherwise simulate a confirmed quote
      return {
        externalQuoteId: `MOCK-${Date.now()}`,
        premiumTotal: 1200.0,
        raw: { mock: true, message: "Mock quote created successfully", planSummary },
      };
    }

    if (!this.baseUrl) {
      return { raw: { warning: "Missing ALLIANZ_API_BASE_URL" } };
    }

    const token = await this.getAccessToken();
    const url = `${this.baseUrl}/v1/quotes`;

    // Adiciona dados do parceiro/mediador ao payload
    const fullPayload = {
      ...payload,
      mediador: this.mediador,
      parceiro: this.parceiro,
      usuario: this.usuario,
    };

    console.log("=== ALLIANZ REQUEST DEBUG ===");
    console.log("URL:", url);
    console.log("Payload:", JSON.stringify(fullPayload, null, 2));
    console.log("Token:", token ? "Present (length: " + token.length + ")" : "Missing");
    console.log("===========================");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json",
      "X-IBM-Client-Id": this.username || "",
      "X-IBM-Client-Secret": this.password || "",
    };

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(fullPayload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("=== ALLIANZ ERROR RESPONSE ===");
      console.error("Status:", res.status);
      console.error("Response:", JSON.stringify(data, null, 2));
      console.error("==============================");
      throw new Error(`Allianz error ${res.status}: ${JSON.stringify(data)}`);
    }

    return {
      externalQuoteId: (data && (data.id || data.quoteId)) ?? undefined,
      premiumTotal: (data && (data.premiumTotal || data.totalPremium)) ?? undefined,
      paymentOptions: (data && data.paymentOptions) ?? undefined,
      raw: data,
    };
  }

  async getDomain(code: number): Promise<Array<{ code: number; description: string }>> {
    // Mock de domínios - pode ser implementado com chamada real se necessário
    if (code === 9999) {
      return [
        { code: 1, description: "Incêndio / Raio / Explosão" },
        { code: 2, description: "Danos Elétricos" },
        { code: 3, description: "Responsabilidade Civil Familiar" },
      ];
    }
    return [];
  }
}

