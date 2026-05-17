import { Map } from 'ol';
import { getBottomLeft, getTopRight } from 'ol/extent';
import { toLonLat } from 'ol/proj';
import { APP_MODULES } from '../../../../../types';
import { getAppConfig } from '../../../../lib/get-app-config';
import { localSettings } from '../../../../lib/local-settings';
import { geoConstants, settingsValues } from './variables';

const wrapLon = (value: number) => value - Math.floor((value + 180) / 360) * 360;

export const measureGlobalDistance = (map: Map, initialZoom: number) => {
  const MARGIN = 10;
  const REPEAT = 5;

  const view = map.getView();
  const extent = view.calculateExtent(map.getSize());
  const [leftLon, leftLat] = toLonLat(getBottomLeft(extent));
  const [rightLon] = toLonLat(getTopRight(extent));

  const cosLat = Math.cos(leftLat * geoConstants.DEG);
  const sinLat = Math.sin(leftLat * geoConstants.DEG);
  const diffLon = (wrapLon(rightLon) - wrapLon(leftLon)) * geoConstants.DEG;

  const distance = Math.atan2(
    Math.sqrt(
      Math.pow(cosLat * Math.sin(diffLon), 2) +
      Math.pow(cosLat * sinLat - sinLat * cosLat * Math.cos(diffLon), 2)
    ),
    sinLat**2 + cosLat**2 * Math.cos(diffLon)
  ) * geoConstants.E_RAD;

  let totalDistance = distance;
  if (view.getZoom() === initialZoom) {
    totalDistance = 2 * Math.PI * geoConstants.E_RAD * cosLat - distance;
  }

  const spaces = (MARGIN * REPEAT) / document.body.clientWidth;
  const config = getAppConfig();
  const nonMetricPublic =
    location.pathname === APP_MODULES.PUBLIC &&
    config.config.public.enabled &&
    !config.config.public.metric;

  if (localSettings.get('distanceUnit') === settingsValues.UNIT_OF_LENGTH.MI || nonMetricPublic) {
    const value = (((totalDistance * (1 - spaces))/REPEAT) * geoConstants.MI_IN_M);
    return (value > 100 ? value.toFixed(0) : value.toFixed(2)) + ' mi';
  } else {
    const value = ((totalDistance * (1 - spaces))/REPEAT) * geoConstants.KM_IN_M;
    return (value > 100 ? value.toFixed(0) : value.toFixed(2)) + ' km';
  }
};
