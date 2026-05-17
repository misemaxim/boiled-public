import fs from 'fs';
import path from 'path';
import pkg from '../package.json';
import { logger } from '../src/server/lib/logger';

function findLicenseFile(pkgPath: string): string | null {
  const licenseFilePossiblePaths = [
    'LICENSE',
    'LICENCE',
    'LICENSE.txt',
    'LICENCE.txt',
    'LICENSE.md',
    'LICENCE.md',
    'COPYING',
    'COPYING.txt'
  ].map(f => path.join(pkgPath, f));

  const licensePath = licenseFilePossiblePaths.find(f => fs.existsSync(f));
  return licensePath ? fs.readFileSync(licensePath, 'utf8') : null;
}

(() => {
  const nodeModules = path.join(process.cwd(), 'node_modules');
  const licenses: Record<string, {
    version: string;
    text: string;
  }> = {};

  const extractPkgLicense = (pkgName: string) => {
    if (licenses[pkgName]) {
      return;
    }

    const pkgPath = path.join(nodeModules, pkgName);
    const pkgJsonPath = path.join(pkgPath, 'package.json');
    if (!fs.existsSync(pkgJsonPath)) {
      licenses[pkgName] = {
        version: 'UNKNOWN',
        text: 'UNKNOWN'
      };
      return;
    }

    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    licenses[pkgName] = {
      version: pkg.version,
      text: findLicenseFile(pkgPath) || pkg.license
    };
    if (pkg.dependencies) {
      for (const depPkgName of Object.keys(pkg.dependencies)) {
        extractPkgLicense(depPkgName);
      }
    }
  };

  for (const dep of Object.keys(pkg.dependencies)) {
    extractPkgLicense(dep);
  }

  let output = 'THIRD-PARTY LICENSES';

  for (const [pkgName, details] of Object.entries(licenses)) {
    output += '\n-------------------------\n\n\n';
    output += `${pkgName}@${details.version}\n\n`;
    output += `${details.text}\n`;
  }

  fs.writeFileSync('build/THIRD_PARTY_LICENSES.txt', output, 'utf8');
  logger.message('Added Third-Party Licenses To Bundle');
})();

(() => {
  let output = `${pkg.name.toUpperCase()} ${pkg.version} LICENSE`;
  output += '\n-------------------------\n\n\n';
  output += fs.readFileSync('LICENSE', 'utf8');

  fs.writeFileSync(`build/${pkg.name.toUpperCase()}_${pkg.version}_LICENSE.txt`, output, 'utf8');
  logger.message('Added App License To Bundle');
})();
