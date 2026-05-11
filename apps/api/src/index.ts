import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const app = express();
const PORT = 3000;

app.use(cors({ origin: ['http://localhost:4200', 'http://localhost:3000'] }));
app.use(express.json());

function getConfigPath() {
  return process.env['CONFIG_PATH'] ?? join(process.cwd(), 'config.json');
}

app.get('/config', (req, res) => {
  const path = getConfigPath();
  if (!existsSync(path)) {
    res.status(404).json({
      error: `config.json not found at ${path}. Run \`landing-engine preview\` to create one.`,
    });
    return;
  }
  try {
    res.json(JSON.parse(readFileSync(path, 'utf-8')));
  } catch {
    res.status(500).json({ error: 'Failed to parse config.json — check for syntax errors.' });
  }
});

app.put('/config', (req, res) => {
  const path = getConfigPath();
  try {
    writeFileSync(path, JSON.stringify(req.body, null, 2));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
  console.log(`Reading config from: ${getConfigPath()}`);
});
