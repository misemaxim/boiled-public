import LineString from 'ol/geom/LineString';
import Polygon from 'ol/geom/Polygon';
import { getArea, getLength } from 'ol/sphere';
import { dictionary } from '../../../../lib/dictionary';
import { localSettings } from '../../../../lib/local-settings';
import { geoConstants, settingsValues } from './variables';

export const formatLength = ({ line }: { line: LineString }) => {
  const length = getLength(line);
  let formattedLength: [number, string];

  if (localSettings.get('distanceUnit') === settingsValues.UNIT_OF_LENGTH.MI) {
    if (length * geoConstants.YD_IN_M > 100) {
      formattedLength = [
        (Math.round(length * geoConstants.MI_IN_M * 100) / 100),
        dictionary.measurements.mi
      ];
    } else {
      formattedLength = [
        (Math.round(length * geoConstants.YD_IN_M * 100) / 100),
        dictionary.measurements.yd
      ];
    }
  } else {
    if (length > 100) {
      formattedLength = [
        (Math.round(length * geoConstants.KM_IN_M * 100) / 100),
        dictionary.measurements.km
      ];
    } else {
      formattedLength = [
        (Math.round(length * 100) / 100),
        dictionary.measurements.m
      ];
    }
  }

  return formattedLength.join(' ');
};

export const formatArea = ({ polygon }: { polygon: Polygon }) => {
  const area = getArea(polygon);
  let formattedArea: [number, string];

  if (localSettings.get('distanceUnit') === settingsValues.UNIT_OF_LENGTH.MI) {
    if (area * Math.pow(geoConstants.YD_IN_M, 2) > 10000) {
      formattedArea = [
        (Math.round(area * Math.pow(geoConstants.MI_IN_M, 2) * 100) / 100),
        dictionary.measurements.mi
      ];
    } else {
      formattedArea = [
        (Math.round(area * Math.pow(geoConstants.YD_IN_M, 2) * 100) / 100),
        dictionary.measurements.yd
      ];
    }
  } else {
    if (area > 10000) {
      formattedArea = [
        (Math.round(area * Math.pow(geoConstants.KM_IN_M, 2) * 100) / 100),
        dictionary.measurements.km
      ];
    } else {
      formattedArea = [
        (Math.round(area * 100) / 100),
        dictionary.measurements.m
      ];
    }
  }

  return formattedArea.join(' ') + '<sup>2</sup>';
};
