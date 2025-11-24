import { prisma } from "../utils/prisma";

export const propertyRepo = {
  create: (data: any) => prisma.property.create({ data }),

  findByUser: (userId: number) => 
    prisma.property.findMany({ where: { userId } }),

  findById: (id: number) =>
    prisma.property.findUnique({ where: { id } }),

  findByIdWithQuotes: (id: number) =>
    prisma.property.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        quotes: {
          select: {
            id: true,
            status: true,
            createdAt: true
          }
        }
      }
    }),

  update: (id: number, data: any) =>
    prisma.property.update({ where: { id }, data }),

  delete: (id: number) =>
    prisma.property.delete({ where: { id } }),
};
