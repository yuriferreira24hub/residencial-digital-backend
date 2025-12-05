import { quoteRepo } from "../repositories/quote.repo";
import { propertyRepo } from "../repositories/property.repo";
import { policyRepo } from "../repositories/policy.repo";

import { AllianzService } from "../services/allianz.service";

export async function createQuote(payload: any, userId: number) {
  const property = await propertyRepo.findById(payload.propertyId);

  if (!property || property.userId !== userId) {
    throw new Error("Imóvel inválido ou não pertence ao Associado.");
  }

  const ownerCpfCnpj = (property as any).ownerCpfCnpj;
  if (ownerCpfCnpj && payload.cpfCnpj && ownerCpfCnpj !== payload.cpfCnpj) {
    throw new Error("O CPF/CNPJ informado não corresponde ao proprietário deste imóvel.");
  }

  // ================================================
  // RISK DATA ADDRESS
  // ================================================
  // addressNumber: "Informar somente números. Para endereço S/N informar 0"
  // zipCode: Deve ter 8 caracteres exatos
  const addressNum = (property as any).addressNumber ?? property.number;
  const parsedAddressNumber = addressNum === "S/N" || addressNum === "SN" ? "0" : String(addressNum).replace(/\D/g, "");
  const zipCode = String(property.zipCode || "").replace(/\D/g, "").padEnd(8, "0").substring(0, 8);

  const riskDataAddress = {
    address: property.address,
    addressNumber: parsedAddressNumber,
    addressType: payload?.riskDataAddress?.addressType || "R.",
    district: property.district,
    city: property.city,
    state: property.state,
    aditionalAddressInformation: payload?.riskDataAddress?.aditionalAddressInformation || "",
    zipCode,
  };

  // ================================================
  // RISK CATEGORY DATA
  // ================================================
  const housingType = property.type === "Casa" ? 1 : 2; 
  const typeConstruction =
    payload.constructionType === "ALVENARIA" ? 1 :
    payload.constructionType === "MADEIRA" ? 2 : 1;

  // propertyUse: 1=Residencial, 2=Comercial, 3=Misto, 4=Industrial, 5=Agrícola
  const propertyUse = typeof payload.propertyUse === "number" ? payload.propertyUse : 1;
  const buyerType = typeof payload.buyerType === "number" ? payload.buyerType : 1;

  // activityType é OBRIGATÓRIO apenas quando propertyUse === 3 (Misto)
  // Conforme spec Allianz: "Somente para Uso do Imóvel: Moradia Mista"
  const activityType = propertyUse === 3 
    ? (typeof payload.activityType === "number" ? payload.activityType : 1)
    : 0;

  const riskCategoryData = {
    buyerType,
    propertyUse,
    typeConstruction,
    activityType,
    housingType,
  };

  // ================================================
  // VALID ALLIANZ PAYLOAD
  // ================================================
  const allianzPayload = {
    cpfCnpj: payload.cpfCnpj || ownerCpfCnpj,
    clientName: payload.clientName,
    assistanceType: payload.assistanceType || 3120,
    // guaranteeType: Spec indica domínio 3044, mas valores válidos não documentados
    // Usando default 1 por enquanto — confirmar com Allianz
    guaranteeType: payload.guaranteeType || 1,
    insuranceType: payload.insuranceType || 3092,
    initialDateInsurance: payload.initialDateInsurance,
    isopainel: payload.isopainel || "N",
    congenereId: payload.congenereId || "",
    apoliceNumber: payload.apoliceNumber || "",

    paymentData: {
      commission: payload.paymentData?.commission || 0,
      capDiscount: payload.paymentData?.capDiscount || 0,
      injury: payload.paymentData?.injury || 0,
      paymentMode: payload.paymentData?.paymentMode || 1,
      paymentOption: payload.paymentData?.paymentOption || 1,
      // Nome conforme documentação oficial (página 34) - com typo "Amtecipation"
      commissionAmtecipation: payload.paymentData?.commissionAntecipation || "N",
    },
    riskCategoryData,
    riskDataAddress,
    // Coberturas: code é STRING com 4 caracteres (domínio "9999" conforme spec)
    listCoverage: (payload.listCoverage || []).map((c: any) => ({
      code: String(c.code).padStart(4, "0"),  // Pad to 4 chars per spec
      sumInsured: Number(c.sumInsured),
    })),
    // partnerData: Todos 5 campos opcionais conforme spec da Allianz
    partnerData: {
      partnerBankCode: payload?.partnerData?.partnerBankCode || "",
      partnerBrokerCode: payload?.partnerData?.partnerBrokerCode || "",
      partnerCenterId: payload?.partnerData?.partnerCenterId || "",
      partnerCooperativeCode: payload?.partnerData?.partnerCooperativeCode || "",
      partnerServicePointCode: payload?.partnerData?.partnerServicePointCode || "",
    },
  };

  console.log("=== SENDING TO ALLIANZ (CLEAN PAYLOAD) ===");
  console.log(JSON.stringify(allianzPayload, null, 2));
  console.log("==========================================");

  // ================================================
  // CALL ALLIANZ API
  // ================================================
  const allianz = await new AllianzService().quote(allianzPayload);

  // ================================================
  // SAVE QUOTE
  // ================================================
  const request = { ...payload, riskDataAddress, riskCategoryData };
  const isPaymentOptions = request?.paymentData?.paymentMode === 0;

  const quote = await quoteRepo.create({
    userId,
    propertyId: property.id,
    request,
    status: isPaymentOptions ? "payment-options" : "pending",
    externalQuoteId: allianz.externalQuoteId,
    premiumTotal: allianz.premiumTotal,
    paymentOptions: allianz.paymentOptions,
    allianzRaw: allianz.raw,
  });

  return {
    message: "Cotação criada com sucesso",
    quote,
  };
}

// ================================================
// GET QUOTES
// ================================================
export async function getQuotes(userId: number) {
  return quoteRepo.findManyByUser(userId);
}

export async function getQuote(id: number, userId: number) {
  const quote = await quoteRepo.findById(id);
  if (!quote || quote.userId !== userId) {
    throw new Error("Cotação não encontrada ou não pertence ao Associado.");
  }
  return quote;
}

// ================================================
// APPROVE / REJECT
// ================================================
export async function approveQuote(quoteId: number, user: any) {
  if (user.role !== "admin") {
    throw new Error("Você não tem permissão para aprovar cotações.");
  }

  const quote = await quoteRepo.findById(quoteId);
  if (!quote) throw new Error("Cotação não encontrada.");
  if (quote.status !== "pending") {
    throw new Error("Esta cotação já foi aprovada ou rejeitada.");
  }

  await quoteRepo.update(quoteId, { status: "approved" });

  const policy = await policyRepo.create({
    quoteId,
    userId: quote.userId,
    policyNumber: "POL" + Date.now(),
    validFrom: new Date(),
    validTo: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    premium: 0,
    status: "active",
  });

  return {
    message: "Cotação aprovada e apólice emitida.",
    policy,
  };
}

export async function rejectQuote(quoteId: number, user: any, reason: string) {
  if (user.role !== "admin") {
    throw new Error("Você não tem permissão para rejeitar cotações.");
  }

  const quote = await quoteRepo.findById(quoteId);
  if (!quote) throw new Error("Cotação não encontrada.");
  if (quote.status !== "pending") {
    throw new Error("Esta cotação já foi processada (aprovada ou rejeitada).");
  }

  const updated = await quoteRepo.update(quoteId, {
    status: "rejected",
    rejectionReason: reason,
  });

  return {
    message: "Cotação rejeitada com sucesso",
    quote: updated,
  };
}

// ================================================
// PENDING LIST (ADMIN)
// ================================================
export async function getPendingQuotes(user: any) {
  if (user.role !== "admin") {
    throw new Error("Apenas administradores podem acessar esta lista.");
  }

  return quoteRepo.findPending();
}

// ================================================
// PUBLIC QUOTE
// ================================================
export async function createPublicQuote(payload: any) {
  return quoteRepo.create({
    request: payload,
    status: "pending",
    userId: null,
    propertyId: null,
  });
}

// ================================================
// CONFIRM PAYMENT
// ================================================
export async function confirmPayment(
  quoteId: number,
  userId: number,
  paymentData: { code: string; installments: number }
) {
  const quote = await quoteRepo.findById(quoteId);

  if (!quote || quote.userId !== userId) {
    throw new Error("Cotação não encontrada ou não pertence ao usuário.");
  }

  if (quote.status !== "payment-options") {
    throw new Error("Esta cotação não está aguardando seleção de pagamento.");
  }

  // Atualiza dados de pagamento
  const request = {
    ...(quote.request as any),
    paymentData: {
      ...((quote.request as any).paymentData || {}),
      paymentMode: paymentData.installments,
      paymentOption: paymentData.installments,
    },
  };

  const allianz = await new AllianzService().quote(request);

  const updated = await quoteRepo.update(quoteId, {
    status: "pending",
    externalQuoteId: allianz.externalQuoteId,
    premiumTotal: allianz.premiumTotal,
    paymentOptions: null,
    allianzRaw: allianz.raw,
  });

  return {
    message: "Meio de pagamento confirmado com sucesso",
    quote: updated,
  };
}
