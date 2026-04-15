import { Person } from '../models/Person.js';
import { Jurisdiction } from '../models/Jurisdiction.js';

export interface PersonDTO {
  id: string;
  name: string;
  role_title: string | null;
  party: string | null;
  gender: string | null;
  birth_date: string | null;
  death_date: string | null;
  image: string | null;
  jurisdiction: {
    id: string;
    name: string;
  } | null;
}

export interface StateDTO {
  value: string;
  label: string;
}

// Garante que apenas os campos mapeados são retornados,
// independente de quais colunas o Sequelize carregou.
export const toPersonDTO = (person: Person): PersonDTO => {
  const jurisdiction = person.get('jurisdiction') as Jurisdiction | null;

  return {
    id: person.id,
    name: person.name,
    role_title: person.role_title || null,
    party: person.party || null,
    gender: person.gender || null,
    birth_date: person.birth_date || null,
    death_date: person.death_date || null,
    image: person.image || null,
    jurisdiction: jurisdiction
      ? { id: jurisdiction.id, name: jurisdiction.name }
      : null,
  };
};

export const toStateDTO = (jurisdiction: Jurisdiction): StateDTO | null => {
  if (!jurisdiction.name) return null;
  return { value: jurisdiction.id, label: jurisdiction.name };
};
