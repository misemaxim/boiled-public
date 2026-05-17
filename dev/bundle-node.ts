import fs from 'fs';
import https from 'https';
import { argv } from 'yargs';
import AdmZip from 'adm-zip';
import { execSync } from 'child_process';
import { logger } from '../src/server/lib/logger';

const scripts = {
  win: [
    '@echo off',
    'setlocal',
    '',
    'set ROOT_DIR=%~dp0',
    'set NODE_PATH=%ROOT_DIR%node_lib\\node.exe',
    'set APP_PATH=%ROOT_DIR%src\\index.js',
    '',
    '"%NODE_PATH%" "%APP_PATH%"'
  ].join('\n'),
  linux: [
    '#!/bin/sh',
    '',
    'ROOT_DIR="$(dirname "$0")"',
    'NODE_PATH="$ROOT_DIR/node_lib/bin/node"',
    'APP_PATH="$ROOT_DIR/src/index.js"',
    '',
    '"$NODE_PATH" "$APP_PATH"'
  ].join('\n'),
  mac: [
    '#!/bin/sh',
    '',
    'ROOT_DIR="$(dirname "$0")"',
    'NODE_PATH="$ROOT_DIR/node_lib/bin/node"',
    'APP_PATH="$ROOT_DIR/src/index.js"',
    '',
    '"$NODE_PATH" "$APP_PATH"'
  ].join('\n')
};

(async () => {
  const nvmFileContent = fs.readFileSync('.nvmrc', 'utf8').trim();
  const nvmVersion = nvmFileContent.startsWith('v') ? nvmFileContent.slice(1) : nvmFileContent;
  const nodeVersion = `v${nvmVersion}`;
  const downloadUrls = {
    win: `https://nodejs.org/dist/${nodeVersion}/node-${nodeVersion}-win-x64.zip`,
    linux: `https://nodejs.org/dist/${nodeVersion}/node-${nodeVersion}-linux-x64.tar.xz`
    // mac: `https://nodejs.org/dist/${nodeVersion}/node-${nodeVersion}-darwin-arm64.tar.gz`
  };
  const os = argv.os as keyof typeof downloadUrls;
  const scriptFile = os === 'win' ? 'run.cmd' : 'run.sh';
  const url = downloadUrls[os];
  const nodeBuildPath = 'build/node_lib';
  const downloadTempPath = 'build/node_lib/temp.zip';

  fs.mkdirSync(nodeBuildPath, { recursive: true });

  await new Promise<void>((resolve, reject) => {
    const zipFile = fs.createWriteStream(downloadTempPath);
    https
      .get(url, res => {
        if (res.statusCode !== 200) {
          logger.error(`Can not bundle Node.js os=${os}, version=${nodeVersion}: failed to download`);
          reject();
        } else {
          res.pipe(zipFile);
          zipFile.on('finish', () => zipFile.close(() => resolve()));
        }
      })
      .on('error', error => {
        logger.error(`Can not bundle node os=${os}, version=${nodeVersion}: ${error.message}`);
        reject();
      });
  });

  if (url.endsWith('.zip')) {
    const zip = new AdmZip(downloadTempPath);
    zip.extractAllTo(nodeBuildPath, true);
  } else {
    execSync(`tar -xf "${downloadTempPath}" -C "${nodeBuildPath}"`);
  }

  const extractedNodeContent = fs.readdirSync(nodeBuildPath);
  const extractedNodeContentRoot = extractedNodeContent.find(item => item.startsWith('node-v'))!;
  const extractedNodeContentRootPath = [nodeBuildPath, extractedNodeContentRoot].join('/');

  for (const entry of fs.readdirSync(extractedNodeContentRootPath)) {
    fs.renameSync([extractedNodeContentRootPath, entry].join('/'), [nodeBuildPath, entry].join('/'));
  }
  fs.rmSync(extractedNodeContentRootPath, { recursive: true, force: true });
  fs.unlinkSync(downloadTempPath);
  fs.writeFileSync(['build', scriptFile].join('/'), scripts[os], 'utf8');

  logger.message(`Bundled Node.js os=${os}, version=${nodeVersion}`);
})();
