import { Jurisdiction } from './Jurisdiction.js';
import { Person } from './Person.js';

Jurisdiction.hasMany(Person, {
  foreignKey: 'jurisdiction_id',
  as: 'people',
});

Person.belongsTo(Jurisdiction, {
  foreignKey: 'jurisdiction_id',
  as: 'jurisdiction',
});

export { Jurisdiction, Person };
