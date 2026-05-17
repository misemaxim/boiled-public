import { Application, static as expressStatic } from 'express';
import { APP_MODULES } from '../../types';
import { validateOperation } from './validate-operation';

export const serverDocs = (app: Application) => {
  app.use('/docs', async (req, res, next) => {
    const validation = await validateOperation(req);
    if (validation) {
      next();
    } else {
      res.redirect(APP_MODULES.LOGIN);
    }
  });

  app.use('/docs', expressStatic('docs'));
};
