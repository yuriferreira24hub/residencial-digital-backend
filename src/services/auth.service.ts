import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  //if (!user) throw new Error('Usuário não encontrado');
  if (!user) {
    return {
      token: "",
      user: {},
      msg: "Usuário não encontrado!"
    };
  }
  const passwordMatch = await bcrypt.compare(password, user.passwordHash);

  //if (!passwordMatch) throw new Error('Senha incorreta');
  if (!passwordMatch) {
    return {
      token: "",
      user,
      msg: "Senha incorreta!"
    };
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '8h' }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}
