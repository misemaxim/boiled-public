import React, { useEffect, useState } from 'react';
import { measureGlobalDistance } from '../lib/measure-global-distance';
import { BOILED_MAP_EVENTS } from '../lib/map-events';
import './bottom-measures.scss';
import { getMinZoom } from '../lib/get-min-zoom';
import { MapContext } from '../../../../../types';

interface BottomMeasuresProps {
  mapContext: MapContext;
}
export const BottomMeasures = (props: BottomMeasuresProps) => {
  const [distance, setDistance] = useState<string>('');
  const initialZoom = getMinZoom(props.mapContext.map.getTarget() as string).byWidth;

  useEffect(() => {
    const calculateDistance = () => {
      setDistance(
        measureGlobalDistance(props.mapContext.map, initialZoom)
      );
    };

    document.addEventListener(BOILED_MAP_EVENTS.MAP_MOVE_ENDED_EVENT, calculateDistance);
    calculateDistance();

    return () => {
      document.removeEventListener(BOILED_MAP_EVENTS.MAP_MOVE_ENDED_EVENT, calculateDistance);
    };
  }, []);

  return (
    <div className="boiled-map-bottom-measures">
      {
        [
          distance,
          distance,
          distance,
          distance,
          distance
        ].map((value, key) => (
          <div key={key} className="boiled-map-bottom-measures-bar">{value}</div>
        ))
      }
    </div>
  );
};
