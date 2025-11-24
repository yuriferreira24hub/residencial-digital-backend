import { propertyRepo } from "../repositories/property.repo";

export async function createProperty(data: any, userId: number) {
  return propertyRepo.create({
    ...data,
    userId
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
  return propertyRepo.update(id, data);
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
