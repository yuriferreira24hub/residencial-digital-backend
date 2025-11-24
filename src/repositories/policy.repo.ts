import { prisma } from "../utils/prisma";

export const policyRepo = {

  create: (data: any) =>
    prisma.policy.create({
      data,
      include: {
        quote: true
      }
    }),

  findByUser: (userId: number) =>
    prisma.policy.findMany({
      where: { userId },
      include: {
        quote: {
          include: {
            property: true
          }
        }
      }
    }),

  findById: (id: number) =>
    prisma.policy.findUnique({
      where: { id },
      include: {
        quote: {
          include: {
            property: true
          }
        }
      }
    }),

  update: (id: number, data: any) =>
    prisma.policy.update({
      where: { id },
      data
    }),
};
