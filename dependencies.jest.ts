import packageFile from './package.json';

describe('dependencies', () => {
  const allDependencies = {
    ...packageFile.devDependencies,
    ...packageFile.dependencies
  };

  test('should have dependencies with fixed version', () => {
    Object.keys(allDependencies).forEach(key => {
      if (allDependencies[key].includes('^')) {
        throw new Error(`dependency [${key}:${allDependencies[key]}] is not specifying the fixed version`);
      }
    });
  });
});
