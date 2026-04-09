import { Request, Response } from 'express';
import { Person } from '../models/Person.js';
import { triggerBackgroundSync } from '../services/openstatesService.js';
import { Op } from 'sequelize';
import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';
import { encodeCursor, decodeCursor } from '../utils/cursorUtils.js';

const getPeopleQuerySchema = z.object({
  state: z.string({ message: 'O filtro de estado deve ser um texto válido' }).optional(),
  party: z.string({ message: 'O filtro de partido deve ser um texto válido' }).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number({ message: 'O limite deve ser um número válido' })
    .min(1, { message: 'O limite deve ser maior que 0' })
    .max(50, { message: 'O limite deve ser menor que 50' })
    .default(30),
});

export const getStatesData = async (req: Request, res: Response) => {
  try {
    const states = await Person.aggregate('state', 'DISTINCT', { plain: false }) as { DISTINCT: string }[];
    res.json({ results: states.map((s) => s.DISTINCT).filter(Boolean).sort() });
  } catch (error) {
    console.error('Erro ao mapear estados:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Erro ao buscar listagem de estados' });
  }
};

export const getPartiesData = async (req: Request, res: Response) => {
  try {
    const parties = await Person.aggregate('party', 'DISTINCT', { plain: false }) as { DISTINCT: string }[];
    res.json({ results: parties.map((p) => p.DISTINCT).filter(Boolean).sort() });
  } catch (error) {
    console.error('Erro ao mapear partidos:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Erro ao buscar listagem de partidos' });
  }
};

export const getPeople = async (req: Request, res: Response) => {
  try {
    const query = getPeopleQuerySchema.safeParse(req.query);

    if (!query.success) {
      return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
        error: 'Filtros inválidos',
        details: z.flattenError(query.error)
      });
    }

    const { state, party, cursor, limit } = query.data;

    const whereClause: any = {};
    if (state) whereClause.state = state;
    if (party) whereClause.party = party;

    if (cursor) {
      try {
        const cursorData = decodeCursor(cursor);

        whereClause[Op.or] = [
          { name: { [Op.gt]: cursorData.name } },
          { name: cursorData.name, id: { [Op.gt]: cursorData.id } }
        ];
      } catch (err) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'O cursor fornecido é inválido' });
      }
    }

    // Busca 1 a mais pra saber se tem próxima página
    const people = await Person.findAll({
      where: whereClause,
      order: [['name', 'ASC'], ['id', 'ASC']],
      limit: limit + 1,
    });

    let nextCursor: string | null = null;

    if (people.length > limit) {
      people.pop();
      const lastPerson = people[people.length - 1];
      nextCursor = encodeCursor({ name: lastPerson.name, id: lastPerson.id });
    }

    res.json({
      results: people,
      pagination: {
        next_cursor: nextCursor || null
      }
    });
  } catch (error) {
    console.error('Erro ao buscar dados com cursor:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Erro interno ao buscar as pessoas' });
  }
};

export const syncPeople = (req: Request, res: Response) => {
  try {
    const result = triggerBackgroundSync();

    if (result.status === 'rejected') {
      res.status(StatusCodes.CONFLICT).json(result);
    } else {
      res.status(StatusCodes.ACCEPTED).json(result);
    }
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

import { getSchedule as getCronSchedule, updateSchedule as updateCronSchedule } from '../services/scheduleService.js';

export const getSyncSchedule = async (req: Request, res: Response) => {
  try {
    const frequency = await getCronSchedule();
    res.json({ frequency });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

const frequencySchema = z.object({
  frequency: z.enum(['none', 'hourly', 'daily', 'every2days', 'every3days', 'weekly'], {
    message: 'Frequência inválida',
  }),
});

export const updateSyncSchedule = async (req: Request, res: Response) => {
  try {
    const parsed = frequencySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
        error: 'Frequência inválida',
        details: z.flattenError(parsed.error),
      });
    }

    await updateCronSchedule(parsed.data.frequency);
    res.json({ message: 'Agendamento atualizado com sucesso', frequency: parsed.data.frequency });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};
