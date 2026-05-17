import fs from 'fs';
import { spawn } from 'child_process';
import pkg from '../package.json';
import { logger } from '../src/server/lib/logger';

fs.writeFileSync('build/config.toml', [
  '# This is server config.',
  '# Check out documentation about configuring it.',
  'superUser=""'
].join('\n'), 'utf8');
fs.writeFileSync('build/.nvmrc', fs.readFileSync('.nvmrc'), 'utf8');

const code = fs.readFileSync('build/src/index.js', 'utf8');
const regex = /require\(\s*["']([^"']+)["']\s*\)/g;
const modules: string[] = [];

let match;
while ((match = regex.exec(code)) !== null) {
  modules.push(match[1]);
}

const productionPackageFile = {
  name: pkg.name,
  version: pkg.version,
  description: pkg.description,
  license: pkg.license,
  dependencies: modules.reduce((deps, moduleName) => {
    const version = (pkg.dependencies as Record<string, string>)[moduleName];
    if (version) {
      deps[moduleName] = version;
    } else {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        deps[moduleName] = require('../node_modules/' + moduleName + '/package.json').version;
      } catch (error) {}
    }

    return deps;
  }, {} as Record<string, string>)
};
productionPackageFile.dependencies['@tabler/icons'] = pkg.dependencies['@tabler/icons'];
productionPackageFile.dependencies['@tabler/icons-webfont'] = pkg.dependencies['@tabler/icons-webfont'];

fs.writeFileSync('build/package.json', JSON.stringify(productionPackageFile, null, 2), 'utf8');
fs.cpSync('docs', 'build/docs', { recursive: true });

spawn('npm', ['install', '--production'], { cwd: 'build', shell: false }).on('close', (code) => {
  if (code === 0) {
    logger.message('Server Modules are extracted successfully');
  } else {
    logger.message('Server Modules are not extracted. Error code: ' + code);
  }
});
