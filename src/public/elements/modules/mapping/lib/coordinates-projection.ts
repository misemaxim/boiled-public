import Mgrs, { LatLon as LatLonUtmMgrs } from 'geodesy/mgrs';
import Utm from 'geodesy/utm';
import LatLon from 'geodesy/latlon-spherical.js';

export const coordinatesProjection = {
  MGRS: {
    toLonLat: (coordinates: string) => {
      const latLon = Mgrs.parse(coordinates).toUtm().toLatLon();
      return [Number(latLon.longitude.toFixed(6)), Number(latLon.latitude.toFixed(6))];
    },
    fromLonLat: (coordinates: [number, number]) => {
      return (LatLonUtmMgrs.parse(coordinates[1], coordinates[0]) as InstanceType<typeof LatLonUtmMgrs>)
        .toUtm().toMgrs().toString();
    }
  },
  UTM: {
    toLonLat: (coordinates: string) => {
      const latLon = Utm.parse(coordinates).toLatLon();
      return [Number(latLon.longitude.toFixed(6)), Number(latLon.latitude.toFixed(6))];
    },
    fromLonLat: (coordinates: [number, number]) => {
      return (LatLonUtmMgrs.parse(coordinates[1], coordinates[0]) as InstanceType<typeof LatLonUtmMgrs>)
        .toUtm().toString();
    }
  },
  DMS: {
    toLonLat: (coordinates: string) => {
      const latLon = LatLon.parse(coordinates);
      return [Number(latLon.longitude.toFixed(6)), Number(latLon.latitude.toFixed(6))];
    },
    fromLonLat: (coordinates: [number, number]) => {
      return LatLon.parse(coordinates[1], coordinates[0]).toString('dms', 2);
    }
  }
};
