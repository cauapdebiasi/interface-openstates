import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

export class Jurisdiction extends Model {
  public declare id: string;
  public declare name: string;
  public declare classification: string;
  public declare last_synced_at: Date | null;
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
    last_synced_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: 'jurisdictions',
    timestamps: true,
  }
);

