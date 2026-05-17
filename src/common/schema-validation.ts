import { string, object, array, number } from 'yup';
import { MapGroup, PointData } from '../types';

const nonEmptyString = string().trim().min(1, 'Cannot be empty');
export const schemaValidation = {
  point: async (data: PointData) => {
    const schema = object({
      id: nonEmptyString,
      coordinates: array().of(number().required()).length(2),
      name: nonEmptyString,
      group: nonEmptyString,
      properties: array().required().of(string()),
      created: number()
    });

    try {
      await schema.validate(data);
      return true;
    } catch (error) {
      return false;
    }
  },
  group: async (data: MapGroup) => {
    const schema = object({
      id: nonEmptyString,
      icon: nonEmptyString,
      name: nonEmptyString,
      color: nonEmptyString,
      properties: array().required().of(string()),
      plugins: array().required().of(string()),
      created: number()
    });

    try {
      await schema.validate(data);
      return true;
    } catch (error) {
      return false;
    }
  }
};
