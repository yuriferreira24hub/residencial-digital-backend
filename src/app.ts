import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

import routes from './routes';
import errorMiddleware from './middlewares/error.middleware';

import propertyRoutes from "./routes/property.routes";
import policyRoutes from "./routes/policy.routes";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import quoteRoutes from "./routes/quotes.routes";

import authMiddleware from "./middlewares/auth.middleware";

const app = express();

app.use(cors());
app.use(express.json());

// 📚 Swagger UI - serve documentação do OpenAPI
const openapiPath = path.resolve(process.cwd(), 'openapi.yaml');
let openapiDoc: any;
try {
	const openapiYaml = fs.readFileSync(openapiPath, 'utf8');
	openapiDoc = YAML.parse(openapiYaml);
	app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc, { explorer: true }));
	app.get('/openapi.json', (_req, res) => res.json(openapiDoc));
	app.get('/openapi.yaml', (_req, res) => {
		res.type('text/yaml').send(openapiYaml);
	});
} catch (err) {
	// Se o arquivo não existir, apenas não monta Swagger
}

// 🔓 ROTAS PÚBLICAS
app.use("/v1/auth", authRoutes);
app.use("/v1/users", userRoutes);

// 🔐 ATIVAR MIDDLEWARE GLOBAL
app.use(authMiddleware);

// 🔐 ROTAS PRIVADAS E PÚBLICAS (gerenciadas pelo middleware)
app.use("/v1/quotes", quoteRoutes);
app.use("/v1/properties", propertyRoutes);
app.use("/v1/policies", policyRoutes);
app.use('/v1', routes);

// MIDDLEWARE DE ERRO
app.use(errorMiddleware);

export default app;
