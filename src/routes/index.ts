import { Router } from 'express';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';

const rootRouter = Router();

rootRouter.use('/auth', authRoutes);
rootRouter.use('/admin', adminRoutes);

export default rootRouter;
