import 'babel-polyfill';
import React from 'react';
import { createRoot } from 'react-dom/client';
import 'materialize-css/dist/js/materialize.min.js';
import 'materialize-css/dist/css/materialize.min.css';
import { App } from './app';

const root = createRoot(document.getElementById('app-root'));
root.render(<App />);
