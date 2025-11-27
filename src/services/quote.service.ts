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

  const riskDataAddress = {
    address: property.address,
    addressNumber: (property as any).addressNumber ?? property.number,
    addressType: (payload?.riskDataAddress?.addressType) || "R.",
    district: property.district,
    city: property.city,
    state: property.state,
    aditionalAddressInformation: (payload?.riskDataAddress?.aditionalAddressInformation) || "",
    zipCode: property.zipCode,
  };

  // Map to Allianz riskCategoryData
  const housingType = property.type === 'Casa' ? 1 : 2; // 1: CASA, 2: APARTAMENTO
  const typeConstruction = payload.constructionType === 'ALVENARIA' ? 1 :
    payload.constructionType === 'MADEIRA' ? 2 : 1; // default ALVENARIA
  const activityType = typeof payload.activityType === 'number' ? payload.activityType : 0;
  const propertyUse = typeof payload.propertyUse === 'number' ? payload.propertyUse : 1;
  const buyerType = typeof payload.buyerType === 'number' ? payload.buyerType : 1;

  const riskCategoryData = {
    activityType,
    housingType,
    typeConstruction,
    propertyUse,
    buyerType,
  };

  // Build Allianz-specific payload (exclude frontend-only fields)
  const allianzPayload = {
    assistanceType: payload.assistanceType,
    guaranteeType: payload.guaranteeType,
    insuranceType: payload.insuranceType,
    initialDateInsurance: payload.initialDateInsurance,
    clientName: payload.clientName,
    cpfCnpj: payload.cpfCnpj,
    // Inclui userId conforme estrutura esperada (mapeado do usuário header, quando disponível)
    userId: (process.env.ALLIANZ_API_USUARIO as string) || undefined,
    isopainel: payload.isopainel,
    congenereId: payload.congenereId,
    apoliceNumber: payload.apoliceNumber,
    paymentData: payload.paymentData,
    riskCategoryData,
    riskDataAddress,
    // Envia códigos de cobertura como número conforme exemplo fornecido
    listCoverage: (payload.listCoverage || []).map((c: any) => ({
      code: typeof c.code === "string" ? parseInt(c.code, 10) : c.code,
      sumInsured: c.sumInsured,
    })),
  };

  console.log("=== SENDING TO ALLIANZ ===");
  console.log("Payload:", JSON.stringify(allianzPayload, null, 2));
  console.log("========================");

  const allianz = await new AllianzService().quote(allianzPayload);
  
  // Store original request for reference
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

export async function approveQuote(quoteId: number, user: any) {

  if (user.role !== "admin") {
    throw new Error("Você não tem permissão para aprovar cotações.");
  }

  const quote = await quoteRepo.findById(quoteId);

  if (!quote) {
    throw new Error("Cotação não encontrada.");
  }

  if (quote.status !== "pending") {
    throw new Error("Esta cotação já foi aprovada ou rejeitada.");
  }

  await quoteRepo.update(quoteId, { status: "approved" });

  const policy = await policyRepo.create({
    quoteId: quoteId,
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

  if (!quote) {
    throw new Error("Cotação não encontrada.");
  }

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

export async function getPendingQuotes(user: any) {
  if (user.role !== "admin") {
    throw new Error("Apenas administradores podem acessar esta lista.");
  }

  return quoteRepo.findPending();
}

export async function createPublicQuote(payload: any) {
  return quoteRepo.create({
    request: payload,
    status: "pending",
    userId: null,
    propertyId: null
  });
}







export async function confirmPayment(quoteId: number, userId: number, paymentData: { code: string; installments: number }) {
  const quote = await quoteRepo.findById(quoteId);

  if (!quote || quote.userId !== userId) {
    throw new Error("Cota��o n�o encontrada ou n�o pertence ao usu�rio.");
  }

  if (quote.status !== "payment-options") {
    throw new Error("Esta cota��o n�o est� aguardando sele��o de pagamento.");
  }

  // Reconstruct the original request with selected payment
  const request = {
    ...quote.request,
    paymentData: {
      ...quote.request.paymentData,
      paymentMode: paymentData.installments,
      paymentOption: paymentData.installments,
    },
  };

  const allianz = await new AllianzService().quote(request);

  // Update quote with confirmed payment
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


