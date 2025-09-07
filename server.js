const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4001;

// Serve static files from public directory
app.use(express.static('public'));

// Serve Three.js from node_modules
app.use('/three', express.static(path.join(__dirname, 'node_modules/three')));

// Main route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '127.0.0.1', () => {
    console.log(`Server listening on http://127.0.0.1:${PORT}`);
  });
