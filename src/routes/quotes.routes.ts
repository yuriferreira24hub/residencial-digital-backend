import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { CreateQuoteSchema } from "../dtos/quote.dto";
import * as quoteController from "../controllers/quotes.controller";
import { RejectQuoteSchema } from "../dtos/reject-quote.dto";

const router = Router();

// Criar cotação
router.post("/", validate(CreateQuoteSchema), quoteController.createQuote);

// Listar cotações
router.get("/", quoteController.getQuotes);

// Buscar uma cotação
router.get("/:id", quoteController.getQuote);

// ADMIN — listar pendentes
router.get("/pending", authMiddleware, quoteController.getPendingQuotes);

// ADMIN — Aprovar cotação
router.post("/:id/approve", authMiddleware, quoteController.approveQuote);

// ADMIN — Rejeitar cotação
router.post(
    "/:id/reject",
    authMiddleware,
    validate(RejectQuoteSchema),
    quoteController.rejectQuote
);

export default router;
