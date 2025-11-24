import { z } from "zod";

export const RejectQuoteSchema = z.object({
  reason: z.string().min(5, "Informe o motivo da rejeição"),
});
