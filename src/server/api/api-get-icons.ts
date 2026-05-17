import fs from 'fs';
import icons from '../../../node_modules/@tabler/icons/tags.json';
import { ByPass } from '../../types';
import { logger } from '../lib/logger';
import { Request, Response } from 'express';

export const apiGetIcons = (req: Request, res: Response): void => {
  try {
    const icon = req.query.icon;
    const color = req.query.color;

    if (!icons[icon as keyof typeof icons]) {
      res.status(404);
      return;
    }

    const content = fs.readFileSync(`node_modules/@tabler/icons/icons/${icon}.svg`).toString();
    const colorized = content.replace('<svg ', '<svg color="' + color + '" ');

    res
      .status(200)
      .setHeader('content-type', 'image/svg+xml')
      .end(colorized);
  } catch (error) {
    logger.error((error as ByPass).toString());
    res.status(500);
  }
};
