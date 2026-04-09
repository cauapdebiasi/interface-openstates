import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

export class Setting extends Model {
  public declare key: string;
  public declare value: string;
}

Setting.init(
  {
    key: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'settings',
    timestamps: true,
  }
);
