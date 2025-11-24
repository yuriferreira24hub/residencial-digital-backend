import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import quotesRoutes from './quotes.routes';
import domainsRoutes from './domains.routes';


const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/quotes', quotesRoutes);
router.use('/domains', domainsRoutes);


export default router;
