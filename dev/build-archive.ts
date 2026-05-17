import fs from 'fs';
import archiver from 'archiver';
import pkg from '../package.json';
import path from 'path';
import { logger } from '../src/server/lib/logger';
import { argv } from 'yargs';

const buildArchive = async () => {
  const dir = 'build';
  const os = argv.os || 'server';

  const fileName = [pkg.name, os, pkg.version, Date.now()].join('-');
  const archiveName = `${fileName}.zip`;
  const destination = `build/${archiveName}`;
  const source = 'build/';

  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(destination);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      logger.message('Build is archived successfully: ' + archive.pointer() + ' total bytes');
      resolve('');
    });

    output.on('end', () => {
      logger.error('Data has been drained');
      reject();
    });

    archive.on('warning', err => {
      logger.warning(err.message);
      reject();
    });

    archive.on('error', err => {
      logger.warning(err.message);
      reject();
    });

    archive.pipe(output);
    archive.glob('**/*', {
      cwd: source,
      ignore: [archiveName]
    });
    archive.finalize();
  });

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === archiveName) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    fs.rmSync(fullPath, { recursive: true, force: true });
  }
};

buildArchive();
