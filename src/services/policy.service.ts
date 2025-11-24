import { policyRepo } from "../repositories/policy.repo";
import { quoteRepo } from "../repositories/quote.repo";

export async function createPolicy(payload: any, userId: number) {
  const quote = await quoteRepo.findById(payload.quoteId);

  if (!quote) {
    throw new Error("Cotação não encontrada.");
  }

  if (quote.userId !== userId) {
    throw new Error("Você não tem permissão para usar essa cotação.");
  }

  const policy = await policyRepo.create({
    quoteId: quote.id,
    userId,
    policyNumber: "POL" + Date.now(), 
    validFrom: new Date(payload.validFrom),
    validTo: new Date(payload.validTo),
    premium: payload.premium,
    status: "active"
  });

  return policy;
}

export async function getPolicies(userId: number) {
  return policyRepo.findByUser(userId);
}

export async function getPolicy(id: number, userId: number) {
  const policy = await policyRepo.findById(id);

  if (!policy || policy.userId !== userId) {
    throw new Error("Apólice não encontrada.");
  }

  return policy;
}
