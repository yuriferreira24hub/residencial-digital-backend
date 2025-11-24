import { prisma } from "../utils/prisma";

export const quoteRepo = {
  create: (data: any) =>
    prisma.quote.create({
      data,
    }),

  findById: (id: number) =>
    prisma.quote.findUnique({
      where: { id },
    }),

  findManyByUser: (userId: number) =>
    prisma.quote.findMany({
      where: { userId },
    }),

  findAll: () => prisma.quote.findMany(),

  findPending: () =>
    prisma.quote.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" }
    }),

  update: (id: number, data: any) =>
    prisma.quote.update({
      where: { id },
      data,
    }),
};
