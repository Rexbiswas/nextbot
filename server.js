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
    const [cpu, mem, net] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.networkStats()
    ]);
    
    res.json({
      cpu: Math.round(cpu.currentLoad),
      ram: Math.round((mem.active / mem.total) * 100),
      net: {
        rx: Math.round(net[0]?.rx_sec / 1024) || 0, 
        tx: Math.round(net[0]?.tx_sec / 1024) || 0
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`NextBot System Bridge running on http://localhost:${PORT}`);
});

