import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const publicPaths = [
  "/auth/login",
  "/users",
  "/quotes/public"
];

export default function authMiddleware(req: Request, res: Response, next: NextFunction) {

  const cleanPath = req.path.replace("/v1", "");

  console.log("PATH:", req.path);
  console.log("CLEAN PATH:", cleanPath);

  const isPublic = publicPaths.some(path => cleanPath.startsWith(path));
  console.log("Public:", isPublic);

  if (isPublic) {
    return next();
  }

  const header = req.headers.authorization;
  
  if (!header) {
    return res.status(401).json({ message: "Token não informado" });
  }

  const [, token] = header.split(" ");

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    req.user = {
      id: decoded.sub || decoded.id,   
      role: decoded.role || "client"
    };

    return next();

  } catch (err) {
    return res.status(401).json({ message: "Token inválido" });
  }
}
