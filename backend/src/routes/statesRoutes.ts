import { Router } from 'express';
import { getStatesData } from '../controllers/peopleController.js';

const router = Router();

router.get('/', getStatesData);

export default router;
