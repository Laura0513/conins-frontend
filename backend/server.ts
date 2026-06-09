import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { securityHeaders, rateLimiterGlobal, authRateLimiter} from './middleware/security.js';
import { auditLogger } from './middleware/audit.js';
import { errorHandler } from './middleware/errorHandler.js';
import { verifyToken } from './middleware/auth.js';

import authRoutes from './routes/auth.routes.js';
import instructorRoutes from './routes/instructor.routes.js';
import fichaRoutes from './routes/ficha.routes.js';
import asignacionRoutes from './routes/asignacion.routes.js';
import horarioRoutes from './routes/horario.routes.js';
import ambienteRoutes from './routes/ambiente.routes.js';
import alertaRoutes from './routes/alerta.routes.js';
import notificacionRoutes from './routes/notificacion.routes.js';
import catalogoRoutes from './routes/catalogo.routes.js';
import programaRoutes from './routes/programa.routes.js';
import auditoriaRoutes from './routes/auditoria.routes.js';
import consultaRoutes from './routes/consulta.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Security headers (Helmet)
app.use(securityHeaders);

// Global rate limiter
app.use(rateLimiterGlobal);

// CORS
app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

app.use(express.json({ limit: '10kb' }));

// Audit logger — tracks all API calls
app.use(auditLogger);

// Auth routes with strict rate limiting
app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/crear-password', authRateLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/instructores', instructorRoutes);
app.use('/api/fichas', fichaRoutes);
app.use('/api/asignaciones', asignacionRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/ambientes', ambienteRoutes);
app.use('/api/alertas', alertaRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/catalogo', catalogoRoutes);
app.use('/api/programas', programaRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api/consultas', consultaRoutes);

// Error handler — must be last
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`CONINS backend v4 corriendo en puerto ${PORT}`);
});

export default app;
