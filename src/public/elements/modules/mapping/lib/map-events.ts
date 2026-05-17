import { Feature, Map } from 'ol';
import { platformModifierKeyOnly } from 'ol/events/condition';
import { DragPan } from 'ol/interaction';
import { toLonLat } from 'ol/proj';
import { contextMapMenuHelper } from './context-menu-helper';
import { overlayManager } from '../../../../lib/overlay-manager';
import { mapContext } from './map-service';
import Geometry from 'ol/geom/Geometry';
import { sessionManager } from '../../../../lib/session-manager';
import { getIndexedGeometry } from './map-interactions-scope';
import { dictionary } from '../../../../lib/dictionary';
import { isPublicMode } from './is-public-mode';
import { PointData } from '../../../../../types';

export enum BOILED_MAP_EVENTS {
  MAP_MOVE_ENDED_EVENT = 'boiled-map-move-ended'
}

export const eventsScope: {
  savedCoordinates: [number, number];
  pointData: PointData;
} = {
  savedCoordinates: [0, 0],
  pointData: {} as PointData
};

let freeDraggingIsActive = false;
export const freeDragging = {
  start: () => {
    freeDraggingIsActive = true;
  },
  stop: () => {
    freeDraggingIsActive = false;
  },
  isActive: () => freeDraggingIsActive
};

export const setMapEvents = (map: Map) => {
  const target = (document.getElementById(map.getTarget() as string) as HTMLDivElement);

  document.addEventListener('keydown', event => {
    if (event.ctrlKey) {
      target.style.cursor = 'grab';
    }
  });

  document.addEventListener('keyup', () => {
    target.style.cursor = '';
  });

  map.addInteraction(new DragPan({
    condition: event => {
      return freeDraggingIsActive || platformModifierKeyOnly(event);
    }
  }));

  target.addEventListener('contextmenu', event => {
    event.preventDefault();
    if (isPublicMode()) {
      return;
    }

    const coordinate = map.getEventCoordinate(event);
    eventsScope.savedCoordinates = [
      toLonLat(coordinate)[0],
      toLonLat(coordinate)[1]
    ];

    contextMapMenuHelper.open(event.x, event.y);
  });

  map.on('click', event => {
    const feature = map.forEachFeatureAtPixel(event.pixel, feature => feature) as Feature<Geometry> | undefined;
    if (feature) {
      const isDraw = mapContext.segments.draw.source.hasFeature(feature);
      const isArrow = mapContext.segments.arrows.source.hasFeature(feature);
      const pointData = feature.get('pointData');

      if (pointData) {
        eventsScope.pointData = pointData;
        overlayManager.open('pointInfo', pointData);
      }

      if (isDraw) {
        overlayManager.open('confirm', {
          message: dictionary.labels.titleMappingGeometry,
          confirmButtonText: dictionary.defaultActions.delete,
          onConfirm: () => {
            const measurementId = feature.get('measure');
            if (measurementId) {
              const overlay = mapContext.map.getOverlays().getArray().find(o => o.getId() === measurementId);
              mapContext.map.removeOverlay(overlay);
            }

            mapContext.segments.draw.source.removeFeature(feature);
            sessionManager.index(getIndexedGeometry([mapContext.segments.draw.source, mapContext.segments.arrows.source]));
          }
        });
      }

      if (isArrow) {
        overlayManager.open('confirm', {
          message: dictionary.labels.titleMappingGeometry,
          confirmButtonText: dictionary.defaultActions.delete,
          onConfirm: () => {
            mapContext.segments.arrows.source.removeFeature(feature);
            sessionManager.index(getIndexedGeometry([mapContext.segments.draw.source, mapContext.segments.arrows.source]));
          }
        });
      }
    }


    contextMapMenuHelper.close();
  });

  map.on('movestart', () => {
    contextMapMenuHelper.close();
  });

  map.on('moveend', () => {
    const event = new CustomEvent(BOILED_MAP_EVENTS.MAP_MOVE_ENDED_EVENT);
    document.dispatchEvent(event);
  });

  map.on('pointermove', event => {
    if (!event.originalEvent.ctrlKey) {
      const feature = map.forEachFeatureAtPixel(event.pixel, feature => feature) as Feature<Geometry> | undefined;
      if (feature) {
        const isDraw = mapContext.segments.draw.source.hasFeature(feature);
        const isArrow = mapContext.segments.arrows.source.hasFeature(feature);
        const isPoint = !!feature.get('pointData');
        target.style.cursor = isDraw || isArrow || isPoint ? 'pointer' : '';
      } else {
        target.style.cursor = '';
      }
    }
  });
};
