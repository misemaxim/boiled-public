import React from 'react';
import { APP_MODULES } from '../types';
import { getAppConfig } from './lib/get-app-config';
import { urlService } from './lib/url-service';

export const HomeRouter = () => {
  const loggedUser = getAppConfig().username;
  if (loggedUser) {
    urlService.change(APP_MODULES.MAP, true);
  } else {
    urlService.change(APP_MODULES.LOGIN, true);
  }

  return (
    <div></div>
  );
};
