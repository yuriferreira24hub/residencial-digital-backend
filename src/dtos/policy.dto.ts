import { z } from "zod";

export const CreatePolicySchema = z.object({
  quoteId: z.number().int().positive(),
  validFrom: z.string().min(8),
  validTo: z.string().min(8),
  premium: z.number().positive()
});
