import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import sequelize from './config/database.js';
import './models/Person.js';
import peopleRoutes from './routes/peopleRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1/people', peopleRoutes);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados estabelecida com sucesso.');

    // TODO: Remover alter: true em produção
    await sequelize.sync({ alter: true });
    console.log('Modelos sincronizados com o banco de dados.');

    app.listen(env.PORT, () => {
      console.log(`Servidor rodando na porta ${env.PORT}`);
    });
  } catch (error) {
    console.error('Não foi possível conectar ao banco de dados:', error);
    process.exit(1);
  }
};

startServer();
