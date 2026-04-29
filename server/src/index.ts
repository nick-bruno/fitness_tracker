import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: resolve(__dirname, '../../.env') });

import express from 'express';
import cors from 'cors';

import muscleGroupsRouter from './routes/muscleGroups';
import exercisesRouter from './routes/exercises';
import workoutsRouter from './routes/workouts';
import recommendationsRouter from './routes/recommendations';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001');

app.use(cors());
app.use(express.json());

app.use('/api/muscle-groups', muscleGroupsRouter);
app.use('/api/exercises', exercisesRouter);
app.use('/api/workouts', workoutsRouter);
app.use('/api/recommendations', recommendationsRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
