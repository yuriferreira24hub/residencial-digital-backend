import { prisma } from "../utils/prisma";

export const quoteRepo = {
  create: (data: any) =>
    prisma.quote.create({
      data: {
        user: { connect: { id: Number(data.userId) } },
        property: { connect: { id: Number(data.propertyId) } },
        request: data.request,
        status: data.status,
        // Prisma schema compat: map and drop unsupported fields
        quotationNumber: data.externalQuoteId ?? null,
        response: data.allianzRaw ?? null,
      },
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
