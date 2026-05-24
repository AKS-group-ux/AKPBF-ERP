import express from 'express';
import { 
  customHelmet, 
  securedCors, 
  globalLimiter, 
  speedDampener, 
  securityLogger, 
  sqlAndXssShield 
} from './middleware/security';
import { globalErrorHandler } from './middleware/error';
import authRoutes from './routes/authRoutes';
import apiRoutes from './routes/apiRoutes';

const app = express();

// 1. Audit log monitor
app.use(securityLogger);

// 2. Rigid Security Headers (HSTS, CSP, Frame ancestors)
app.use(customHelmet);

// 3. CORS Policies
app.use(securedCors);

// 4. Input Sanitization & Payload limits
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// 5. Anti-injection and Cross Site Scripting Shields
app.use(sqlAndXssShield);

// 6. Velocity limiters & Slow Down speed defense
app.use(globalLimiter);
app.use(speedDampener);

// 7. Base API Routers
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// General health check with status metadata
app.get('/api/health-check', (req, res) => {
  res.json({
    status: 'operational',
    service: 'AKPBF-Backend-Enterprise',
    api_version: '2.0.0-PROD-SECURE',
    timestamp: new Date().toISOString()
  });
});

// 8. Global database and system errors translator
app.use(globalErrorHandler);

export default app;
