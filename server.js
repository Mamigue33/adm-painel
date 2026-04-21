const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('frontend'));
app.use('/data', express.static('data'));

// Helper para ler/escrever JSON
const readJSON = (file) => JSON.parse(fs.readFileSync(`./data/${file}.json`));
const writeJSON = (file, data) => fs.writeFileSync(`./data/${file}.json`, JSON.stringify(data, null, 2));

// Garantir que os ficheiros existem
if (!fs.existsSync('./data/users.json')) fs.copyFileSync('./data/init.json', './data/users.json');

// ==================== AUTENTICAÇÃO ====================
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = readJSON('users');
  const user = users.find(u => u.username === username);
  if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });
  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Senha incorreta' });
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, 'SECRET_KEY', { expiresIn: '8h' });
  res.json({ token, role: user.role, username: user.username, email: user.email, expires: user.expires });
});

app.get('/api/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });
  try {
    const decoded = jwt.verify(token, 'SECRET_KEY');
    const users = readJSON('users');
    const user = users.find(u => u.id === decoded.id);
    res.json({ username: user.username, role: user.role, email: user.email, created: user.created, expires: user.expires });
  } catch(e) { res.status(401).json({ error: 'Token inválido' }); }
});

// ==================== CONFIGURAÇÕES ====================
app.get('/api/configs', (req, res) => {
  const configs = readJSON('configs');
  res.json(configs);
});

app.post('/api/configs', (req, res) => {
  let configs = readJSON('configs');
  const newConfig = { id: Date.now(), ...req.body, createdAt: new Date().toISOString() };
  configs.push(newConfig);
  writeJSON('configs', configs);
  res.json(newConfig);
});

app.delete('/api/configs/:id', (req, res) => {
  let configs = readJSON('configs');
  configs = configs.filter(c => c.id != req.params.id);
  writeJSON('configs', configs);
  res.json({ success: true });
});

// ==================== CATEGORIAS ====================
app.get('/api/categories', (req, res) => { res.json(readJSON('categories')); });
app.post('/api/categories', (req, res) => {
  let cats = readJSON('categories');
  const newCat = { id: Date.now(), name: req.body.name, active: true };
  cats.push(newCat);
  writeJSON('categories', cats);
  res.json(newCat);
});
app.delete('/api/categories/:id', (req, res) => {
  let cats = readJSON('categories');
  cats = cats.filter(c => c.id != req.params.id);
  writeJSON('categories', cats);
  res.json({ success: true });
});

// ==================== CDN ====================
app.get('/api/cdn', (req, res) => { res.json(readJSON('cdnList')); });
app.post('/api/cdn', (req, res) => {
  let cdns = readJSON('cdnList');
  const newCdn = { id: Date.now(), url: req.body.url, name: req.body.name };
  cdns.push(newCdn);
  writeJSON('cdnList', cdns);
  res.json(newCdn);
});
app.delete('/api/cdn/:id', (req, res) => {
  let cdns = readJSON('cdnList');
  cdns = cdns.filter(c => c.id != req.params.id);
  writeJSON('cdnList', cdns);
  res.json({ success: true });
});

// ==================== TEXTOS ====================
app.get('/api/texts', (req, res) => { res.json(readJSON('texts')); });
app.put('/api/texts/:key', (req, res) => {
  let texts = readJSON('texts');
  texts[req.params.key] = req.body;
  writeJSON('texts', texts);
  res.json({ success: true });
});

// ==================== NOTIFICAÇÕES ====================
app.get('/api/notifications', (req, res) => { res.json(readJSON('notifications')); });
app.post('/api/notifications', (req, res) => {
  let nots = readJSON('notifications');
  const newNot = { id: Date.now(), title: req.body.title, message: req.body.message, type: req.body.type, date: new Date().toISOString() };
  nots.unshift(newNot);
  writeJSON('notifications', nots);
  res.json(newNot);
});

// ==================== DISPOSITIVOS ====================
app.get('/api/devices', (req, res) => { res.json(readJSON('devices')); });

// ==================== SESSÕES ====================
app.get('/api/sessions', (req, res) => { res.json(readJSON('sessions')); });
app.post('/api/sessions', (req, res) => {
  let sessions = readJSON('sessions');
  sessions.push({ ...req.body, id: Date.now(), lastActive: new Date().toISOString() });
  writeJSON('sessions', sessions);
  res.json({ success: true });
});
app.delete('/api/sessions/:id', (req, res) => {
  let sessions = readJSON('sessions');
  sessions = sessions.filter(s => s.id != req.params.id);
  writeJSON('sessions', sessions);
  res.json({ success: true });
});

// ==================== APLICAÇÃO (Build APK) ====================
app.get('/api/app/params', (req, res) => {
  const params = fs.existsSync('./data/appParams.json') ? JSON.parse(fs.readFileSync('./data/appParams.json')) : { name: 'AuraVP', package: 'com.auravp.app', version: '1.0.0', versionCode: 1, logoUrl: '', offlinePack: [] };
  res.json(params);
});
app.post('/api/app/params', (req, res) => {
  fs.writeFileSync('./data/appParams.json', JSON.stringify(req.body, null, 2));
  res.json({ success: true });
});

// ==================== TEMAS ====================
app.get('/api/themes', (req, res) => { res.json(readJSON('themes')); });
app.post('/api/themes', (req, res) => {
  let themes = readJSON('themes');
  themes.push({ id: Date.now(), ...req.body, date: new Date().toISOString() });
  writeJSON('themes', themes);
  res.json({ success: true });
});

// ==================== ESTATÍSTICAS ====================
app.get('/api/stats', (req, res) => {
  const users = readJSON('users');
  const devices = readJSON('devices');
  res.json({ users: users.length, devices: devices.length, sessions: readJSON('sessions').length, notifications: readJSON('notifications').length });
});

// Rota principal
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'frontend', 'index.html')); });

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
  console.log(`📋 Login: admin / admin123  |  Mamigue / admin123`);
});
