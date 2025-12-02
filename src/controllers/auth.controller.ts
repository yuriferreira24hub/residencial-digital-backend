import { Request, Response } from 'express';
import * as authService from '../services/auth.service';

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  
  // Define cookie HttpOnly com o token JWT
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.cookie('auth_token', result.token, {
  httpOnly: true,        // Não acessível via JavaScript
  secure: isProduction,  // HTTPS apenas em produção
  sameSite: isProduction ? 'strict' : 'lax',
  maxAge: 3600000,       // 1 hora
  path: '/',
  });

  return res.json({
  message: 'Login realizado com sucesso',
  user: result.user,     // Token NÃO é retornado no body
  });
}

export async function check(req: Request, res: Response) {
  // Se chegou aqui, o middleware de auth já validou o token
  return res.json({
    authenticated: true,
    user: req.user,
  });
}

export async function logout(req: Request, res: Response) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
  });
  
  return res.json({ message: 'Logout realizado com sucesso' });
}
