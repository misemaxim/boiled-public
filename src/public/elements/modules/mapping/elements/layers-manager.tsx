import React from 'react';
import './layers-manager.scss';
import { DataRow } from '../../../../interface/data-row';
import { mapContext } from '../lib/map-service';

interface LayersManagerProps {
  onToggle: (layer: string) => void;
}
export const LayersManager = (props: LayersManagerProps) => {
  const currentLayer = mapContext.layers.getCurrent();
  const mapLayers = mapContext.layers.getAvailable();

  return (
    <div className="boiled-map-layers-manager">
      {mapLayers.map(layer => (
        <DataRow
          key={layer.id}
          icon={layer.id === currentLayer ? 'circle-check' : 'circle'}
          name={layer.title}
          onClick={() => {
            props.onToggle(layer.id);
          }}
          actions={[]}
        />
      ))}
    </div>
  );
};
