import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { CreatePropertySchema } from "../dtos/property.dto";
import * as propertyController from "../controllers/properties.controller";

const router = Router();

router.post("/", authMiddleware, validate(CreatePropertySchema), propertyController.create);
router.get("/", authMiddleware, propertyController.list);
router.get("/:id", authMiddleware, propertyController.get);
router.put("/:id", authMiddleware, validate(CreatePropertySchema), propertyController.update);
router.delete("/:id", authMiddleware, propertyController.remove);
router.get("/:id/quotes", authMiddleware, propertyController.getWithQuotes);

export default router;
