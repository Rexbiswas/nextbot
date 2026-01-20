import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/command', (req, res) => {
  const { command } = req.body;

  if (!command) return res.status(200).send('No command provided');

  console.log(`Received command: ${command}`);

  exec(`start ${command}`, (error, stdout) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).send({ error: error.message });
    }
    res.send({ status: 'success', output: stdout });
  });
});

import si from 'systeminformation';

app.get('/stats', async (req, res) => {
  try {
    const timeout = (prom, time, defaultVal) => Promise.race([
      prom,
      new Promise(resolve => setTimeout(() => resolve(defaultVal), time))
    ]);

    console.log('Stats requested');
    const [cpu, mem] = await Promise.all([
      timeout(si.currentLoad(), 2000, { currentLoad: 0 }),
      timeout(si.mem(), 2000, { active: 0, total: 1 })
    ]);
    console.log('Stats fetched');

    // Mock network stats to prevent hanging on Windows
    const net = [];

    res.json({
      cpu: Math.round(cpu.currentLoad || 0),
      ram: Math.round((mem.active / mem.total) * 100) || 0,
      net: {
        rx: 0,
        tx: 0
      }
    });
    console.log('Stats response sent');
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`NextBot System Bridge running on http://localhost:${PORT}`);
});

