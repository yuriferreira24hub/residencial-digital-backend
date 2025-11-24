import { prisma } from "../utils/prisma";
import bcrypt from "bcrypt";

export const userService = {
  // ============================
  // 1. Criar usuário
  // ============================
  async createUser(data: any) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error("Este e-mail já está cadastrado. Tente outro.");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
      },
    });

    return user;
  },

  // ============================
  // 2. Buscar todos usuários
  // ============================
  async getUsers() {
    return prisma.user.findMany({
      select: { id: true, name: true, email: true, createdAt: true },
    });
  },

  // ============================
  // 3. Buscar usuário por ID
  // ============================
  async getUserById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, createdAt: true },
    });
  },

  // ============================
  // 4. Atualizar usuário
  // ============================
  async updateUser(id: number, data: any) {
    return prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
      },
      select: { id: true, name: true, email: true },
    });
  },

  // ============================
  // 5. Apagar usuário
  // ============================
  async deleteUser(id: number) {
    return prisma.user.delete({
      where: { id },
    });
  }
};
