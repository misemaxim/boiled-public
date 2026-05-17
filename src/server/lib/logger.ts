import chalk from 'chalk';

const getTimestamp = () => (new Date()).toISOString().split('.')[0] + 'Z';

export const logger = {
  message: async (message: string) => {
    // eslint-disable-next-line no-console
    console.log(
      chalk.inverse(chalk.bold(chalk.cyan((' MESSAGE ')))),
      '>',
      chalk.inverse(chalk.bold(chalk.cyanBright(` ${getTimestamp()} `))),
      '>',
      message
    );
  },
  warning: async (message: string) => {
    // eslint-disable-next-line no-console
    console.log(
      chalk.inverse(chalk.bold(chalk.yellow((' WARNING ')))),
      '>',
      chalk.inverse(chalk.bold(chalk.yellowBright(` ${getTimestamp()} `))),
      '>',
      message
    );
  },
  error: async (message: string) => {
    // eslint-disable-next-line no-console
    console.log(
      chalk.inverse(chalk.bold(chalk.red(('  ERROR  ')))),
      '>',
      chalk.inverse(chalk.bold(chalk.redBright(` ${getTimestamp()} `))),
      '>',
      message
    );
  }
};
