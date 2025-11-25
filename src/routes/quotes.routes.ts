import { Router } from "express"; 
import { validate } from "../middlewares/validate.middleware";
import { CreateQuoteSchema } from "../dtos/quote.dto";
import * as quoteController from "../controllers/quotes.controller";
import { RejectQuoteSchema } from "../dtos/reject-quote.dto";

const router = Router();

// 🔓 ROTA PÚBLICA
router.post("/public", quoteController.createPublicQuote);

// 🔐 ROTAS AUTENTICADAS
router.post("/", validate(CreateQuoteSchema), quoteController.createQuote);
router.get("/", quoteController.getQuotes);

// 🔐 ROTAS ADMIN (sem parâmetros - devem vir antes das rotas com :id)
router.get("/pending", quoteController.getPendingQuotes);

// 🔐 ROTAS COM PARÂMETROS (devem vir por último)
router.get("/:id", quoteController.getQuote);
router.post("/:id/approve", quoteController.approveQuote);
router.post(
    "/:id/reject",
    validate(RejectQuoteSchema),
    quoteController.rejectQuote
);

export default router;
