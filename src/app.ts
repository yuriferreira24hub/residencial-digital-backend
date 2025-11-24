import express from 'express';
import cors from 'cors';
import routes from './routes';
import errorMiddleware from './middlewares/error.middleware';
import propertyRoutes from "./routes/property.routes";
import policyRoutes from "./routes/policy.routes";



const app = express();


app.use(cors());
app.use(express.json());

app.use('/v1', routes);

app.use(errorMiddleware);

app.use("/v1/properties", propertyRoutes);

app.use("/v1/policies", policyRoutes);

export default app;
