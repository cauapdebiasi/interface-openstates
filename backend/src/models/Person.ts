import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

export class Person extends Model {
  public id!: string;
  public name!: string;
  public role_title!: string;
  public party!: string;
  public state!: string;
  public image!: string | null;
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
    state: {
      type: DataTypes.STRING,
      allowNull: true,
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
