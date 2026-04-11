import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

export class Person extends Model {
  public declare id: string;
  public declare name: string;
  public declare role_title: string;
  public declare party: string;
  public declare jurisdiction_id: string | null;
  public declare image: string | null;
}

Person.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role_title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    party: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    jurisdiction_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'jurisdictions',
        key: 'id',
      },
    },
    image: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'people',
    timestamps: true,
  }
);

