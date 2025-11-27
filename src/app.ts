import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

import routes from './routes';
import errorMiddleware from './middlewares/error.middleware';
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

// 🔐 Aplica middleware de autenticação (com verificação de rotas públicas internas)
app.use(authMiddleware);

// 🌐 Todas as rotas da API
app.use('/v1', routes);

// MIDDLEWARE DE ERRO
app.use(errorMiddleware);

export default app;
