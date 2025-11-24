import { Router } from "express";
import { DomainsController } from "../controllers/domains.controller";

const router = Router();
const controller = new DomainsController();

router.get("/:code", controller.getDomain);

export default router;
