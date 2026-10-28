import { Router } from 'express';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import userRoutes from './user.routes';
import umkmRoutes from './umkm.routes';
import eventRoutes from './event.routes';
import uploadRoutes from './upload.routes';

const rootRouter = Router();

rootRouter.use('/auth', authRoutes);
rootRouter.use('/admin', adminRoutes);
rootRouter.use('/users', userRoutes);
rootRouter.use('/umkm', umkmRoutes);
rootRouter.use('/events', eventRoutes);
rootRouter.use('/upload', uploadRoutes);

export default rootRouter;
