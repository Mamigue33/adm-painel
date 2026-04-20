const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Servir ficheiros estáticos da pasta frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Rota de teste
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', message: 'ADM PAINEL AuraVP' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor a correr na porta ${port}`);
});
