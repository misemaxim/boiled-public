import { argv } from 'yargs';

export const isDev = argv.mode === 'development';
