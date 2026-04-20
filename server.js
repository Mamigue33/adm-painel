const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('frontend'));

// Garantir pasta storage
if (!fs.existsSync('./storage')) {
  fs.mkdirSync('./storage');
}

// Carregar utilizadores
const DATA_FILE = './storage/users.json';
let users = [];

if (fs.existsSync(DATA_FILE)) {
  users = JSON.parse(fs.readFileSync(DATA_FILE));
} else {
  users = [
    {
      id: 1,
      username: 'admin',
      password: bcrypt.hashSync('admin123', 10),
      role: 'adm',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      username: 'freeuser',
      password: bcrypt.hashSync('free123', 10),
      role: 'free',
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      username: 'vipuser',
      password: bcrypt.hashSync('vip123', 10),
      role: 'vip',
      created_at: new Date().toISOString()
    }
  ];
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

console.log(`📦 ${users.length} utilizadores carregados`);

// Rotas da API
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  
  if (!user) {
    return res.status(401).json({ error: 'Usuário não encontrado' });
  }
  
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Senha incorreta' });
  }
  
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'SECRET_KEY_AURA_VP_2024',
    { expiresIn: '8h' }
  );
  
  res.json({ token, role: user.role, username: user.username });
});

app.get('/api/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SECRET_KEY_AURA_VP_2024');
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ valid: false });
  }
});

app.get('/api/users', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Não autorizado' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SECRET_KEY_AURA_VP_2024');
    if (decoded.role !== 'adm') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const usersPublic = users.map(u => ({
      id: u.id,
      username: u.username,
      role: u.role,
      created_at: u.created_at
    }));
    res.json(usersPublic);
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
});

app.get('/api/stats', (req, res) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    users_count: users.length,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Rota principal - serve o index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
  console.log(`📋 Contas: admin/admin123, freeuser/free123, vipuser/vip123`);
});
