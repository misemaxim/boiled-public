import { API_ROUTES, AppConfig } from '../../types';
import { customAxios } from './custom-axios';

let config: {
  username: string;
  config: AppConfig & { name: string; version: string; license: string };
};
export const getAppConfig = () => config;

export const initAppConfig = async () => {
  const [
    validation,
    apiConfig
  ] = await Promise.all([
    customAxios.get(API_ROUTES.LOGIN_VALIDATE),
    customAxios.get(API_ROUTES.CONFIG_GET)
  ]);

  config = {
    username: validation ? validation.username : '',
    config: apiConfig
  };
};
