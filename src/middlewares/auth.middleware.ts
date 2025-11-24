import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const publicPaths = [
  "/users",      
  "/auth/login", 
  "/domains",    
  "/quotes"      
];

export default function authMiddleware(req: Request, res: Response, next: NextFunction) {

  // Verifica se a rota é pública
  const isPublic = publicPaths.some(path => req.path.startsWith(path));

  if (isPublic) {
    return next();
  }

  // A partir daqui, requer token
  const header = req.headers.authorization;
  
  if (!header) {
    return res.status(401).json({ message: "Token não informado" });
  }

  const [, token] = header.split(" ");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido" });
  }
}
