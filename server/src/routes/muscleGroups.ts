import { Router } from 'express';
import { getMuscleGroups } from '../services/exerciseService';

const router = Router();

router.get('/', (_req, res) => {
  const groups = getMuscleGroups();
  res.json({ groups });
});

export default router;
