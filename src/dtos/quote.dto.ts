import { z } from "zod";

export const CoverageSchema = z.object({
  code: z.string().min(1),
  sumInsured: z.number().positive(),
});

export const CreateQuoteSchema = z.object({
  propertyId: z.number().int().positive(),

  clientName: z.string().min(3),
  cpfCnpj: z.string().min(11),

  initialDateInsurance: z.string().min(8),

  listCoverage: z.array(CoverageSchema).min(1),
});
