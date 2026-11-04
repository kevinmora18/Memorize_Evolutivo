import fs from 'fs';
import path from 'path';

// Ejecutar todos los archivos de test de la carpeta tests/
const testsDir = path.join(__dirname, '..', 'tests');
const files = fs.readdirSync(testsDir).filter(f => f.endsWith('.test.ts'));

for (const file of files) {
  require(path.join(testsDir, file));
}

