import axios from 'axios';
import { ByPass } from '../../types';
import { showMessage } from '../interface/show-message';

export const customAxios = {
  get: async <R = ByPass>(...args: Parameters<typeof axios.get>): Promise<R> => {
    const response = await axios.get(...args);

    return new Promise(resolve => {
      if (response.data.error) {
        showMessage(response.data.error, 'error');
      } else {
        resolve(response.data.data);
      }
    });
  },
  post: async <R = ByPass>(...args: Parameters<typeof axios.post>): Promise<R> => {
    const response = await axios.post(...args);

    return new Promise(resolve => {
      if (response.data.error) {
        showMessage(response.data.error, 'error');
      } else {
        resolve(response.data.data);
      }
    });
  }
};