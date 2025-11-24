import { Request, Response, NextFunction } from 'express';

export default function errorMiddleware(err: any, req: Request, res: Response, next: NextFunction) {
  console.error("Error:", err);
  res.status(500).json({ message: err.message || 'Erro interno no servidor' });
}
