import { respond } from '../lib/respond';
import { Request, Response } from 'express';
import { getConfig } from '../lib/get-config';
import system from '../../../package.json';
import { validateOperation } from '../lib/validate-operation';

export const apiGetConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const config = { ...getConfig().app, version: system.version, name: system.name, license: system.license };
    const validation = await validateOperation(req);
    if (validation) {
      config.public.enabled = false;
    } else {
      config.layers.customLayers = config.public.layers;
      config.layers.enableDefault = false;
      config.layers.enableSatellite = false;

      if (!config.public.enabled) {
        config.layers.customLayers = [];

        config.public.layers = [];
        config.public.sessionId = '';
        config.public.message = '';
      }
    }

    respond(req, res, config);
  } catch (error) {
    respond(req, res, null, error);
  }
};
