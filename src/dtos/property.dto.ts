import { z } from "zod";

export const CreatePropertySchema = z.object({
  ownerCpfCnpj: z.string().min(11, "CPF/CNPJ deve ter no mínimo 11 caracteres"),
  ownerName: z.string().min(3, "Nome do proprietário deve ter no mínimo 3 caracteres"),
  type: z.string().min(3),
  address: z.string().min(3),
  number: z.string().optional(),
  district: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  zipCode: z.string().min(5),
  
  riskCategory: z.string().optional(),
  constructionYear: z.number().optional(),
  area: z.number().optional(),
  estimatedValue: z.number().positive().optional(),
});

