import { Router } from 'express';
import multer from 'multer';
import { parseNrcZip } from '../services/nrcImportService';
import { createRun, runExistsByExternalId } from '../services/runsService';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const { runs, result } = parseNrcZip(req.file.buffer);

  let imported = 0;
  let skipped = 0;

  for (const run of runs) {
    if (run.external_id && runExistsByExternalId(run.external_id)) {
      skipped++;
      continue;
    }
    createRun(run);
    imported++;
  }

  res.json({ imported, skipped, errors: result.errors });
});

export default router;
