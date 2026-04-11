import { Router } from 'express';
import { getPartiesData } from '../controllers/peopleController.js';

const router = Router();

router.get('/', getPartiesData);

export default router;
