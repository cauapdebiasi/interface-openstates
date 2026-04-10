import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

export class Jurisdiction extends Model {
  public declare id: string;
  public declare name: string;
  public declare classification: string;
}

Jurisdiction.init(
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
    classification: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'jurisdictions',
    timestamps: true,
  }
);
