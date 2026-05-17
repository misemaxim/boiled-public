import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer } from './create-server';
import { APP_MODULES } from '../types';
import { getConfig } from './lib/get-config';
import { logger } from './lib/logger';

const app = express();
const config = getConfig();

[
  '/favicon.ico',
  '/main.css',
  '/bundle.js'
].forEach(route => {
  app.get(route, (req, res) => {
    res.sendFile(path.join(__dirname + route));
  });
});

[
  '/',
  ...Object.values(APP_MODULES)
].forEach(route => {
  app.get(route, async (req, res) => {
    const pathToIndex = path.join(__dirname + '/index.html');
    const appHtmlOutput = fs.readFileSync(pathToIndex, 'utf8');
    res.send(appHtmlOutput);
  });
});

app.get('/images/:file', (req, res) => {
  const file = req.params.file;
  res.sendFile(path.join(__dirname + '/images/' + file));
});

app.get('/fonts/:file', (req, res) => {
  const file = req.params.file;
  res.sendFile(path.join(__dirname + '/fonts/' + file));
});

app.listen(config.server.port, () => {
  logger.message(`The server for Boiled - Cartography Notepad is listening on port ${config.server.port}.`);
});

createServer(app);
