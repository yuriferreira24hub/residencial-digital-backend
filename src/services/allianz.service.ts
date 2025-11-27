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
    housingType: number;
  };
  partnerData?: Record<string, string | undefined>;
  riskDataAddress?: Record<string, any>;
  listCoverage: Array<{ code: number; sumInsured: number }>;
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

    // Não adicionar mediador/parceiro/usuario ao payload — devem ir apenas nos headers
    // Além disso, sanitiza caso o frontend tenha enviado esses campos no corpo
    const { mediador: _m, parceiro: _p, usuario: _u, ...sanitized } = (payload as any);
    if (_m || _p || _u) {
      console.warn("[WARN] Campos mediador/parceiro/usuario vieram no payload do frontend e foram removidos antes do envio aos headers.");
      console.warn("mediador:", _m ? "presente" : "ausente", "parceiro:", _p ? "presente" : "ausente", "usuario:", _u ? "presente" : "ausente");
    }
    const fullPayload = { ...(sanitized as AllianzQuotePayload) };

    console.log("=== ALLIANZ REQUEST DEBUG ===");
    console.log("URL:", url);
    console.log("Payload:", JSON.stringify(fullPayload, null, 2));
    console.log("Token:", token ? "Present (length: " + token.length + ")" : "Missing");
    console.log("===========================");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json",
      // Cabeçalhos específicos do gateway
      usuario: this.usuario || "",
      parceiro: this.parceiro || "",
      mediador: this.mediador || "",
      cooperativeCode: process.env.ALLIANZ_API_COOPERATIVE_CODE || "",
    };

    // Logs adicionais solicitados para inspeção do payload e headers
    console.log("=== PAYLOAD ENVIADO PARA A ALLIANZ ===");
    console.log(JSON.stringify(fullPayload, null, 2));
    console.log("=== HEADERS ===");
    // Evita vazar segredos nos logs
    const redactedHeaders = {
      ...headers,
      Authorization: headers["Authorization"] ? "Bearer ****" : headers["Authorization"],
    } as Record<string, string | undefined>;
    console.log(redactedHeaders);

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
      // Fallback: em caso de 404, tentar modo de listagem de meios de pagamento (paymentMode: 0)
      if (res.status === 404) {
        const fallbackPayload = {
          ...fullPayload,
          paymentData: {
            ...(fullPayload as any).paymentData,
            paymentMode: 0,
          },
        } as AllianzQuotePayload;
        // remover paymentOption se existir
        if ((fallbackPayload as any).paymentData) {
          delete (fallbackPayload as any).paymentData.paymentOption;
        }
        console.log("=== FALLBACK PAYMENT MODE 0 ===");
        console.log("Payload:", JSON.stringify(fallbackPayload, null, 2));
        const resFallback = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(fallbackPayload),
        });
        const dataFallback = await resFallback.json().catch(() => ({}));
        if (!resFallback.ok) {
          console.error("=== FALLBACK ERROR RESPONSE ===");
          console.error("Status:", resFallback.status);
          console.error("Response:", JSON.stringify(dataFallback, null, 2));
          console.error("===============================");
          throw new Error(`Allianz error ${res.status}: ${JSON.stringify(data)}`);
        }
        console.log("=== FALLBACK SUCCESS (payment options) ===");
        return {
          externalQuoteId: undefined,
          premiumTotal: undefined,
          paymentOptions: (dataFallback && dataFallback.paymentOptions) ?? dataFallback,
          raw: dataFallback,
        };
      }
      // Segunda sondagem: tentar apenas cobertura obrigatória (Incêndio code 1)
      if (res.status === 404) {
        const minimalCoveragePayload: AllianzQuotePayload = {
          ...fullPayload,
          listCoverage: [{ code: 1, sumInsured: 0 }],
        };
        console.log("=== MINIMAL COVERAGE PROBE (code 1) ===");
        console.log("Payload:", JSON.stringify(minimalCoveragePayload, null, 2));
        const resMinimal = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(minimalCoveragePayload),
        });
        const dataMinimal = await resMinimal.json().catch(() => ({}));
        if (resMinimal.ok) {
          console.log("=== MINIMAL COVERAGE SUCCESS ===");
          return {
            externalQuoteId: (dataMinimal && (dataMinimal.id || dataMinimal.quoteId)) ?? undefined,
            premiumTotal: (dataMinimal && (dataMinimal.premiumTotal || dataMinimal.totalPremium)) ?? undefined,
            paymentOptions: (dataMinimal && dataMinimal.paymentOptions) ?? undefined,
            raw: dataMinimal,
          };
        }
      }
      throw new Error(`Allianz error ${res.status}: ${JSON.stringify(data)}`);
    }

    // Normaliza diferentes formatos de resposta da Allianz
    const nested = (data && data.quoteCoverageResponse && data.quoteCoverageResponse.return && data.quoteCoverageResponse.return.value) || null;
    const nestedPremium = nested?.packages?.premium;
    const nestedQuoteId = nested?.quotationNumber || nested?.operationNumber;

    // Logs adicionais dos identificadores quando presentes
    if (nestedQuoteId) {
      console.log("=== ALLIANZ QUOTE IDS ===");
      console.log("quotationNumber:", nested?.quotationNumber);
      console.log("operationNumber:", nested?.operationNumber);
      console.log("premium:", nestedPremium);
      console.log("=========================");
    }

    return {
      // Preferir quotationNumber, depois operationNumber; só então campos planos
      externalQuoteId: nestedQuoteId ?? (data && (data.id || data.quoteId)) ?? undefined,
      premiumTotal: nestedPremium ?? (data && (data.premiumTotal || data.totalPremium)) ?? undefined,
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

