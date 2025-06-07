const express = require('express');
const path = require('path');
const http = require('http'); // 
const socketIo = require('socket.io'); 

const compraRoutes = require('./routes/compraRoutes');

const app = express();
const server = http.createServer(app); // 
const io = socketIo(server); // 

const PORT = 3000;

// Middleware y rutas
app.use(express.json());
app.use('/backend/qrs', express.static(path.join(__dirname, 'qrs')));
app.use('/api', compraRoutes);

// Servir archivos frontend
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});


require('../Arduino/arduino')(io); 

// Iniciar servidor HTTP con socket.io
server.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
