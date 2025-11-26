import { propertyRepo } from "../repositories/property.repo";

function calculateRiskCategory(
  area?: number,
  constructionYear?: number | null,
  estimatedValue?: number | null
) {
  const a = area ?? 0;
  const y = constructionYear ?? null;
  const v = estimatedValue ?? 0;
  if (a > 200 || (y !== null && y < 1990) || v > 800_000) return "alto";
  if (a >= 101 || (y !== null && y >= 1990 && y <= 2004)) return "medio";
  if (a <= 100 && (y !== null && y >= 2005)) return "baixo";
  return "medio";
}

export async function createProperty(data: any, userId: number) {
  const riskCategory = calculateRiskCategory(data.area, data.constructionYear, data.estimatedValue);
  return propertyRepo.create({
    ...data,
    userId,
    riskCategory,
  });
}

export async function listProperties(userId: number) {
  return propertyRepo.findByUser(userId);
}

export async function getProperty(id: number, userId: number) {
  const property = await propertyRepo.findById(id);

  if (!property || property.userId !== userId)
    throw new Error("Imóvel não encontrado");

  return property;
}

export async function updateProperty(id: number, data: any, userId: number) {
  const property = await getProperty(id, userId);
  const riskCategory = calculateRiskCategory(
    data.area ?? property.area,
    data.constructionYear ?? property.constructionYear,
    data.estimatedValue ?? property.estimatedValue
  );
  return propertyRepo.update(id, { ...data, riskCategory });
}

export async function deleteProperty(id: number, userId: number) {
  const property = await getProperty(id, userId);
  return propertyRepo.delete(id);
}

export async function getPropertyWithQuotes(id: number, userId: number) {
  const property = await propertyRepo.findByIdWithQuotes(id);

  if (!property || property.userId !== userId) {
    throw new Error("Imóvel não encontrado ou não pertence ao usuário.");
  }

  return property;
}
