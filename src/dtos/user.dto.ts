import { z } from "zod";

export const CreateUserSchema = z.object({
  name: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  role: z.enum(["client", "admin"]).optional(),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(3, "Nome deve ter ao menos 3 caracteres").optional(),
  email: z.string().email("E-mail inválido").optional(),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres").optional(),
  role: z.enum(["client", "admin"]).optional(),
});
