import { merge } from 'lodash';
import { ByPass } from '../../types';
import { settingsValues } from '../elements/modules/mapping/lib/variables';

const SETTINGS_STORAGE_ID = '_boiled_local_settings';
const defaultLocalSettings = {
  lastSessionId: '',
  defaultLayerId: 'stamen_toner',
  distanceUnit: settingsValues.UNIT_OF_LENGTH.KM
};
export const localSettings = {
  set: (key: keyof typeof defaultLocalSettings, value: ByPass): void => {
    const storedLocalSettings: typeof defaultLocalSettings = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_ID) || '{}');
    storedLocalSettings[key] = value;
    localStorage.setItem(SETTINGS_STORAGE_ID, JSON.stringify(storedLocalSettings));
  },
  get: <T = ByPass>(key: keyof typeof defaultLocalSettings): T => {
    const storedLocalSettings = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_ID) || '{}');
    return merge({ ...defaultLocalSettings }, storedLocalSettings)[key];
  },
  reset: (): void => {
    localStorage.setItem(SETTINGS_STORAGE_ID, JSON.stringify(defaultLocalSettings));
  }
};
