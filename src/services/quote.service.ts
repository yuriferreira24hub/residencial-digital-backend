import { quoteRepo } from "../repositories/quote.repo";
import { propertyRepo } from "../repositories/property.repo";
import { policyRepo } from "../repositories/policy.repo";

export async function createQuote(payload: any, userId: number) {
  const property = await propertyRepo.findById(payload.propertyId);

  if (!property || property.userId !== userId) {
    throw new Error("Imóvel inválido ou não pertence ao Associado.");
  }

  const riskDataAddress = {
    address: property.address,
    number: property.number,
    district: property.district,
    city: property.city,
    state: property.state,
    zipCode: property.zipCode,
  };

  const request = {
    ...payload,
    riskDataAddress,
  };

  const quote = await quoteRepo.create({
    userId,
    propertyId: property.id,
    request,
    status: "pending",
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
