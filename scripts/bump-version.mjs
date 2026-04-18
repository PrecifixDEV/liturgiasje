import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const versionFilePath = path.join(__dirname, '..', 'src', 'constants', 'version.ts');

function bumpVersion() {
  try {
    const content = fs.readFileSync(versionFilePath, 'utf8');
    const match = content.match(/export const APP_VERSION = "(\d+\.\d+)";/);

    if (!match) {
      console.error("Não foi possível encontrar a versão no formato esperado.");
      process.exit(1);
    }

    const currentVersionStr = match[1];
    const [major, minor] = currentVersionStr.split('.').map(Number);
    
    // Incrementa a parte minor
    const nextVersion = `${major}.${minor + 1}`;

    const newContent = content.replace(
      `export const APP_VERSION = "${currentVersionStr}";`,
      `export const APP_VERSION = "${nextVersion}";`
    );

    fs.writeFileSync(versionFilePath, newContent);
    console.log(JSON.stringify({
      oldVersion: currentVersionStr,
      newVersion: nextVersion
    }));
  } catch (error) {
    console.error("Erro ao processar versão:", error);
    process.exit(1);
  }
}

bumpVersion();
