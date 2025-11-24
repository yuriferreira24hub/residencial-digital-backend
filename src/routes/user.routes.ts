import { Router } from "express";
import * as userController from "../controllers/users.controller";
import { validate } from "../middlewares/validate.middleware";
import { CreateUserSchema, UpdateUserSchema } from "../dtos/user.dto";
import authMiddleware from "../middlewares/auth.middleware";

const router = Router();

// PÚBLICA
router.post("/", validate(CreateUserSchema), userController.createUser);

// PÚBLICA (para testes)
router.get("/", userController.getUsers);

// PRIVADAS
router.get("/:id", authMiddleware, userController.getUser);
router.put("/:id", authMiddleware, validate(UpdateUserSchema), userController.updateUser);
router.delete("/:id", authMiddleware, userController.deleteUser);

export default router;
