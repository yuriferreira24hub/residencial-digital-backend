import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const validate =
  (schema: ZodSchema<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("[DEBUG] validate - req.body ANTES:", JSON.stringify(req.body, null, 2));
      const validatedData = schema.parse(req.body);
      console.log("[DEBUG] validate - validatedData DEPOIS:", JSON.stringify(validatedData, null, 2));
      req.body = validatedData; // Substitui req.body pelos dados validados
      next();
    } catch (error: any) {
      return res.status(400).json({
        message: "Erro de validação",
        issues: error.errors,
      });
    }
  };
