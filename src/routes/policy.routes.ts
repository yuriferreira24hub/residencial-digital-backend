import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { CreatePolicySchema } from "../dtos/policy.dto";
import * as policyController from "../controllers/policy.controller";

const router = Router();

router.post("/", authMiddleware, validate(CreatePolicySchema), policyController.createPolicy);
router.get("/", authMiddleware, policyController.getPolicies);
router.get("/:id", authMiddleware, policyController.getPolicy);

export default router;
