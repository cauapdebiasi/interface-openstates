import { Router } from 'express';
import { getPeople, syncPeople, getSyncSchedule, updateSyncSchedule } from '../controllers/peopleController.js';

const router = Router();

router.get('/', getPeople);
router.post('/sync', syncPeople);
router.get('/sync/schedule', getSyncSchedule);
router.put('/sync/schedule', updateSyncSchedule);

export default router;
