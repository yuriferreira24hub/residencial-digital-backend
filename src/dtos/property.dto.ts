import { z } from "zod";

export const CreatePropertySchema = z.object({
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
});
