import { Router } from 'express';
import { getStatesData, getPartiesData, getPeople, syncPeople } from '../controllers/peopleController.js';

const router = Router();

router.get('/states', getStatesData);
router.get('/parties', getPartiesData);
router.get('/', getPeople);
router.post('/sync', syncPeople);

export default router;
