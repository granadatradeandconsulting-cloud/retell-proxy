import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Configurazione CORS per produzione
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['*'];

app.use(cors({
  origin: allowedOrigins[0] === '*' ? '*' : allowedOrigins,
  credentials: true
}));

app.use(express.json());

// Variabili d'ambiente
const API_KEY = process.env.RETELL_API_KEY || 'key_95c488d64b9f5824c3e166d7d1b4';
const AGENT_ID = process.env.RETELL_AGENT_ID || 'agent_15c45e965ed7bf204dd74777a3';
const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Servi il SDK bundle
app.get('/retell-sdk-bundle.js', (req, res) => {
  try {
    const sdkPath = join(__dirname, 'retell-sdk-bundle.js');
    const sdkContent = readFileSync(sdkPath, 'utf8');
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache 24h
    res.send(sdkContent);
    console.log('✓ SDK servito');
  } catch (error) {
    console.error('❌ Errore SDK:', error.message);
    res.status(404).send('// SDK not found');
  }
});

// Endpoint per creare la chiamata
app.post('/create-call', async (req, res) => {
  try {
    console.log('📞 Creazione chiamata...');
    
    const response = await fetch('https://api.retellai.com/v2/create-web-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ agent_id: AGENT_ID })
    });
    
    const data = await response.json();
    
    if (data.access_token) {
      console.log('✓ Token generato:', data.access_token.substring(0, 20) + '...');
    } else {
      console.error('✗ Risposta API:', data);
    }
    
    res.json(data);
  } catch (error) {
    console.error('✗ Errore:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Servi file statici
app.use(express.static('.', {
  maxAge: '1d', // Cache statico per 1 giorno
  etag: true
}));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('\n========================================');
  console.log('✓ Retell Proxy Server Attivo');
  console.log('========================================');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Port: ${PORT}`);
  console.log(`Agent ID: ${AGENT_ID}`);
  console.log('\nServer ready!\n');
});