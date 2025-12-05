import { z } from "zod";

export const CoverageSchema = z.object({
  code: z.union([z.string(), z.number()]),  // Can be string or number (will be padded to 4 chars)
  sumInsured: z.number().positive(),
});

export const PaymentDataSchema = z.object({
  commission: z.number().optional(),
  capDiscount: z.number().optional(),
  injury: z.number().optional(),
  paymentOption: z.number().optional(),
  // paymentMode: Enum conforme spec (0=Todas, 1=Débito, 2=Boleto, 4=Cartão)
  paymentMode: z.number().refine(
    (val) => [0, 1, 2, 4].includes(val),
    "paymentMode deve ser 0, 1, 2 ou 4"
  ).optional(),
  commissionAntecipation: z.string().optional(),
});

export const RiskCategoryDataSchema = z.object({
  buyerType: z.number().int().min(1).max(2)
    .refine((val) => val >= 1 && val <= 2, "buyerType deve ser 1 (PF) ou 2 (PJ)")
    .optional(),
  housingType: z.number().int().min(1).max(3)
    .refine((val) => val >= 1 && val <= 3, "housingType deve ser 1-3")
    .optional(),
  propertyUse: z.number().int().min(1).max(5)
    .refine((val) => val >= 1 && val <= 5, "propertyUse deve ser 1-5")
    .optional(),
  typeConstruction: z.number().int().min(1).max(3)
    .refine((val) => val >= 1 && val <= 3, "typeConstruction deve ser 1-3")
    .optional(),
  activityType: z.number().int().optional(),
});

export const PartnerDataSchema = z.object({
  partnerBankCode: z.string().optional(),
  partnerBrokerCode: z.string().optional(),
  partnerCenterId: z.string().optional(),
  partnerCooperativeCode: z.string().optional(),
  partnerServicePointCode: z.string().optional(),
}).optional();

export const RiskDataAddressSchema = z.object({
  address: z.string().optional(),
  addressNumber: z.string().optional(),
  addressType: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  aditionalAddressInformation: z.string().optional(),
  zipCode: z.string().optional(),
}).passthrough();

export const CreateQuoteSchema = z.object({
  propertyId: z.number().int().positive(),

  clientName: z.string().min(3),
  cpfCnpj: z.string().min(11),

  // initialDateInsurance: deve estar em formato ddMMyyyy (ex: 06122025)
  initialDateInsurance: z.string()
    .regex(/^\d{8}$/, "initialDateInsurance deve estar no formato ddMMyyyy (8 dígitos)"),
  assistanceType: z.number().int().optional(),
  guaranteeType: z.number().int().optional(),
  insuranceType: z.number().int().optional(),
  isopainel: z.string().optional(),
  congenereId: z.string().optional(),
  apoliceNumber: z.string().optional(),

  paymentData: PaymentDataSchema.optional(),
  riskCategoryData: RiskCategoryDataSchema.optional(),
  riskDataAddress: RiskDataAddressSchema.optional(),
  partnerData: PartnerDataSchema.optional(),

  listCoverage: z.array(CoverageSchema).min(1),
}).passthrough();
