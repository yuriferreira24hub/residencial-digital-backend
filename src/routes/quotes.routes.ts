import { Router } from "express"; 
import { validate } from "../middlewares/validate.middleware";
import authenticate from "../middlewares/auth.middleware";
import { CreateQuoteSchema } from "../dtos/quote.dto";
import * as quoteController from "../controllers/quotes.controller";
import { RejectQuoteSchema } from "../dtos/reject-quote.dto";

const router = Router();

//  ROTA PÚBLICA
router.post("/public", quoteController.createPublicQuote);

//  ROTAS AUTENTICADAS
router.post("/", authenticate, validate(CreateQuoteSchema), quoteController.createQuote);
router.get("/", authenticate, quoteController.getQuotes);

//  ROTAS ADMIN (sem parâmetros - devem vir antes das rotas com :id)
router.get("/pending", authenticate, quoteController.getPendingQuotes);

//  ROTAS COM PARÂMETROS (devem vir por último)
router.get("/:id", authenticate, quoteController.getQuote);
router.post("/:id/approve", authenticate, quoteController.approveQuote);
router.post("/:id/payment", authenticate, quoteController.confirmPayment);
router.post(
    "/:id/reject",
    authenticate,
    validate(RejectQuoteSchema),
    quoteController.rejectQuote
);

export default router;
