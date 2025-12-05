import fetch from "node-fetch";

const BASE_URL = process.env.ALLIANZ_API_BASE_URL || ""; 
const TOKEN_ENDPOINT = process.env.ALLIANZ_TOKEN_ENDPOINT || "";
const USERNAME = process.env.ALLIANZ_USERNAME || "";
const PASSWORD = process.env.ALLIANZ_PASSWORD || "";

// Estes 3 campos são OBRIGATÓRIOS no body das chamadas REST
// conforme manual — brokerCode, partner, userId
const BROKER_CODE = process.env.ALLIANZ_API_MEDIADOR || ""; 
const PARTNER = process.env.ALLIANZ_API_PARCEIRO || "";
const USER_ID = process.env.ALLIANZ_API_USUARIO || "";

export interface AllianzQuotePayload {
  cpfCnpj: string;
  clientName: string;
  assistanceType: number;
  guaranteeType: number;
  insuranceType: number;
  initialDateInsurance: string;
  isopainel: string;
  congenereId?: string;
  apoliceNumber?: string;

  paymentData: {
    capDiscount: number;
    commission: number;
    commissionAmtecipation: string;  // Nome exato conforme doc
    injury: number;
    paymentMode: number;
    paymentOption: number;
  };

  riskCategoryData: {
    buyerType: number;
    propertyUse: number;
    typeConstruction: number;
    activityType: number;
    housingType: number;
  };

  partnerData: {
    partnerBankCode?: string;
    partnerBrokerCode?: string;
    partnerCenterId?: string;
    partnerCooperativeCode?: string;
    partnerServicePointCode?: string;
  };
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
    private brokerCode: string = BROKER_CODE,
    private partner: string = PARTNER,
    private userId: string = USER_ID
  ) {}

  // ============================================
  // OAUTH TOKEN
  // ============================================
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const auth = Buffer.from(`${this.username}:${this.password}`).toString("base64");

    const res = await fetch(this.tokenEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to get access token: ${res.status} - ${await res.text()}`);
    }

    const data = await res.json();
    this.accessToken = data.access_token;
    this.tokenExpiry =
      Date.now() + (data.expires_in || 3600) * 1000 - 300000;

    return this.accessToken!;
  }

  // ============================================
  // QUOTE COVERAGE
  // ============================================
  async quote(payload: AllianzQuotePayload): Promise<AllianzQuoteResponse> {
    const mockMode = process.env.ALLIANZ_MOCK_MODE === "true";
    if (mockMode) {
      return {
        externalQuoteId: `MOCK-${Date.now()}`,
        premiumTotal: 1200,
        raw: { mock: true },
      };
    }

    if (!this.baseUrl) {
      return { raw: { warning: "Missing ALLIANZ_API_BASE_URL" } };
    }

    const token = await this.getAccessToken();
    const url = `${this.baseUrl}/quoteCoverage`;

    // ============================================
    // CAMPOS OBRIGATÓRIOS NO BODY (CRÍTICO!)
    // ============================================
    // O frontend não deve enviar estes campos — são responsabilidade do servidor.
    // Removemos caso venham, e acrescentamos corretamente.
    const { brokerCode, partner, userId, ...sanitized } = payload as any;

    const fullPayload = {
      brokerCode: this.brokerCode,
      partner: this.partner,
      userId: this.userId,
      ...sanitized,
    };

    console.log("========== PAYLOAD FINAL PARA ALLIANZ ==========");
    console.log("URL:", url);
    console.log("Payload:", JSON.stringify(fullPayload, null, 2));
    console.log("Token:", token ? `${token.substring(0, 20)}...` : "MISSING");
    console.log("==============================================");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(fullPayload),
    });

    const responseText = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(responseText);
    } catch {}

    // ============================================
    // TRATAMENTO DE ERRO
    // ============================================
    if (!res.ok) {
      throw new Error(
        `Allianz error ${res.status}: ${JSON.stringify(data)}`
      );
    }

    // ============================================
    // NORMALIZAÇÃO DO RETORNO DA ALLIANZ
    // ============================================
    const nested =
      data?.quoteCoverageResponse?.return?.value || null;

    const nestedPremium = nested?.packages?.premium;
    const nestedQuoteId =
      nested?.quotationNumber || nested?.operationNumber;

    return {
      externalQuoteId:
        nestedQuoteId ?? data.id ?? data.quoteId ?? undefined,

      premiumTotal:
        nestedPremium ??
        data.premiumTotal ??
        data.totalPremium ??
        undefined,

      paymentOptions: data.paymentOptions ?? undefined,
      raw: data,
    };
  }

  // ============================================
  // DOMÍNIOS (mock)
  // ============================================
  async getDomain(code: number) {
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