const express = require('express');
const path = require('path');
const compraRoutes = require('./routes/compraRoutes');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use('/qrs', express.static(path.join(__dirname, 'public', 'qrs')));

app.use('/api', compraRoutes);

const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
