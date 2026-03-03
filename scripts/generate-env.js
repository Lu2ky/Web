#!/usr/bin/env node

/**
 * Script para generar variables de entorno expandidas
 * Lee API_ADDR y API_PORT y genera las URLs completas con prefijo VITE_
 * Funciona con compilación local y Docker
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine which .env file to load
const environment = process.env.NODE_ENV || 'development';
const envFileName = environment === 'docker' ? '.env.docker' : '.env.local';
const envPath = path.join(__dirname, '..', envFileName);

// Fallback a .env si no existe el específico del ambiente
const fallbackEnvPath = path.join(__dirname, '..', '.env');
const selectedEnvPath = fs.existsSync(envPath) ? envPath : fallbackEnvPath;

console.log(`📦 Generando variables de entorno desde: ${selectedEnvPath}`);
console.log(`🔧 Ambiente: ${environment}`);

// Load environment variables from file
if (!fs.existsSync(selectedEnvPath)) {
  console.error(`❌ Error: Archivo de entorno no encontrado: ${selectedEnvPath}`);
  process.exit(1);
}

const envContent = fs.readFileSync(selectedEnvPath, 'utf-8');
const envVars = {};

// Parse .env file
envContent.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  }
});

// Expand variables (handle ${VAR} syntax)
const expandedVars = { ...envVars };
let changed = true;
let iterations = 0;
const maxIterations = 10;

while (changed && iterations < maxIterations) {
  changed = false;
  iterations++;
  
  Object.keys(expandedVars).forEach(key => {
    const value = expandedVars[key];
    const newValue = value.replace(/\$\{(\w+)\}/g, (match, varName) => {
      if (expandedVars[varName]) {
        changed = true;
        return expandedVars[varName];
      }
      return match;
    });
    expandedVars[key] = newValue;
  });
}

if (iterations === maxIterations) {
  console.warn('⚠️  Warning: Alcanzado límite de iteraciones expandiendo variables');
}

// Generate output .env file with expanded variables
const outputContent = Object.entries(expandedVars)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

const outputPath = path.join(__dirname, '..', '.env.generated');
fs.writeFileSync(outputPath, outputContent);

console.log(`✅ Variables de entorno generadas: ${outputPath}`);
console.log(`📝 ${Object.keys(expandedVars).length} variables expandidas`);

// Show some key variables for verification (only VITE_ prefixed)
const viteVars = Object.keys(expandedVars).filter(k => k.startsWith('VITE_')).slice(0, 5);
if (viteVars.length > 0) {
  console.log('\n📋 Muestra de variables generadas:');
  viteVars.forEach(varName => {
    const value = expandedVars[varName];
    console.log(`   ${varName}=${value}`);
  });
}
