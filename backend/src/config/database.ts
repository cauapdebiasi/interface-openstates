import { Sequelize } from 'sequelize';
import { env } from './env.js';

const sequelize = new Sequelize(
    env.DB_NAME,
    env.DB_USER,
    env.DB_PASS,
    {
        host: env.DB_HOST,
        port: env.DB_PORT,
        dialect: 'postgres',
        logging: false,
    }
);

export default sequelize;