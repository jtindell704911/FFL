import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

const USERS_FILE = path.join(process.cwd(), 'server', 'users.json');

function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}
function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

app.post('/register', async (req, res) => {
  const { teamName, password } = req.body;
  if (!teamName || !password) return res.status(400).json({ error: 'Missing teamName or password' });
  const users = readUsers();
  if (users.find(u => u.teamName === teamName)) return res.status(409).json({ error: 'Team name already exists' });
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ teamName, password: hashedPassword });
  writeUsers(users);
  res.json({ success: true });
});

app.post('/login', async (req, res) => {
  const { teamName, password } = req.body;
  const users = readUsers();
  const user = users.find(u => u.teamName === teamName);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ success: true });
});

app.post('/save-team', (req, res) => {
  const { teamName, teamPlayers } = req.body;
  if (!teamName || !teamPlayers) return res.status(400).json({ error: 'Missing teamName or teamPlayers' });
  const users = readUsers();
  const userIdx = users.findIndex(u => u.teamName === teamName);
  if (userIdx === -1) return res.status(404).json({ error: 'User not found' });
  users[userIdx].teamPlayers = teamPlayers;
  writeUsers(users);
  res.json({ success: true });
});

app.get('/team/:teamName', (req, res) => {
  const { teamName } = req.params;
  const users = readUsers();
  const user = users.find(u => u.teamName === teamName);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ teamPlayers: user.teamPlayers || {} });
});

app.get('/', (req, res) => {
  res.send('Fantasy Football API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
