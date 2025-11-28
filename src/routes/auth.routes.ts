import { Router } from 'express';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post('/login', authController.login);
router.get('/check', authController.check); // Verificar autenticação
router.post('/logout', authController.logout); // Limpar cookie

export default router;
