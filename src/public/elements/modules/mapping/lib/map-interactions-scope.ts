import Map from 'ol/Map';
import Geometry, { Type as GeometryType } from 'ol/geom/Geometry';
import { Style } from 'ol/style';
import Overlay from 'ol/Overlay';
import { formatArea, formatLength } from './formatters';
import { Circle, LineString, Polygon } from 'ol/geom';
import { nanoid } from 'nanoid';
import { unByKey } from 'ol/Observable';
import { Coordinate } from 'ol/coordinate';
import { Draw } from 'ol/interaction';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import { fromCircle } from 'ol/geom/Polygon';
import { sessionManager } from '../../../../lib/session-manager';
import { ByPass, MapContext, SessionSchema } from '../../../../../types';
import { noop } from 'lodash';
import { MeasureStyle } from './styles';
import { showMessage } from '../../../../interface/show-message';

let currentInteraction: Draw | null;
let measureTooltip: Overlay;
let measureTooltipElement: HTMLDivElement | null;

export const staticMeasureTooltipClass = 'boiled-measure-tooltip';
export const dynamicMeasureTooltipClass = 'boiled-measure-tooltip dynamic';
const staticMeasureTooltipOffset = [0, -10];
const dynamicMeasureTooltipOffset = [0, -15];
const interactions = {
  current: null,
  geometry: noop,
  measurement: noop,
  clear: noop
} as {
  current: string | null,
  geometry: (type: 'LineString' | 'Circle' | 'Polygon' | 'ArrowString' | null) => void;
  measurement: (type: 'LineString#measurement' | 'Polygon#measurement' | null) => void;
  clear: () => void;
};

export const getIndexedGeometry = ([drawSource, arrowsSource]: VectorSource[]) => {
  const geoJSON = new GeoJSON();

  const allGeometryFeatures = drawSource.getFeatures();
  const basicGeometryFeatures = allGeometryFeatures
    .filter(feature => !feature.get('measure'))
    .map(feature => {
      if (feature && feature.getGeometry() instanceof Circle) {
        return new Feature(fromCircle(feature.getGeometry() as Circle));
      } else {
        return feature;
      }
    });
  const measureGeometryFeatures = allGeometryFeatures.filter(feature => feature.get('measure'));

  return {
    geometry: geoJSON.writeFeatures(basicGeometryFeatures),
    measurements: geoJSON.writeFeatures(measureGeometryFeatures),
    arrows: geoJSON.writeFeatures(arrowsSource.getFeatures())
  };
};

export const createMapInteractionsScope = (map: Map, [drawSource, arrowsSource]: VectorSource[]) => {
  const addInteraction = (interaction: Draw, type: string) => {
    map.addInteraction(interaction);
    currentInteraction = interaction;
    interactions.current = type;

    interaction.on('drawend', () => {
      setTimeout(() => {
        sessionManager.index(getIndexedGeometry([drawSource, arrowsSource]));
      }, 500);
    });
  };

  const removeInteraction = () => {
    if (currentInteraction) {
      map.removeInteraction(currentInteraction);
    }

    currentInteraction = null;
    interactions.current = null;
  };

  const addGeometry = (type: 'LineString' | 'Circle' | 'Polygon' | 'ArrowString' | null) => {
    if (measureTooltipElement && measureTooltipElement.parentNode) {
      measureTooltipElement.parentNode.removeChild(measureTooltipElement);
    }

    if (!type || interactions.current === type) {
      removeInteraction();
    } else if (interactions.current !== type) {
      removeInteraction();

      if (type === 'ArrowString') {
        currentInteraction = new Draw({ source: arrowsSource, type: 'LineString' });
      } else {
        currentInteraction = new Draw({ source: drawSource, type: type as GeometryType });
      }

      addInteraction(currentInteraction, type);
    }
  };

  const addMeasurement = (type: 'LineString#measurement' | 'Polygon#measurement' | null): void => {
    if (measureTooltipElement && measureTooltipElement.parentNode) {
      measureTooltipElement.parentNode.removeChild(measureTooltipElement);
    }

    if (!type || interactions.current === type) {
      removeInteraction();
      interactions.current = null;
    } else if (interactions.current !== type) {
      removeInteraction();

      const id = 'measure#' + nanoid(8);
      currentInteraction = new Draw({
        source: drawSource,
        type: type.split('#')[0] as GeometryType,
        style: new Style(MeasureStyle)
      });
      addInteraction(currentInteraction, type);

      measureTooltipElement = document.createElement('div');
      measureTooltipElement.className = dynamicMeasureTooltipClass;
      measureTooltip = new Overlay({
        element: measureTooltipElement,
        offset: dynamicMeasureTooltipOffset,
        positioning: 'bottom-center',
        id
      });
      map.addOverlay(measureTooltip);

      let sketch: Feature<Geometry> | null;
      let listenerChange: ByPass;

      const listenerStart = currentInteraction.on('drawstart', event => {
        sketch = event.feature;

        let tooltipCoord: Coordinate;
        listenerChange = sketch.getGeometry()!.on('change', subEvent => {
          const geom = subEvent.target;
          let output: string | undefined;

          if (geom instanceof Polygon) {
            output = formatArea({ polygon: geom });
            tooltipCoord = geom.getInteriorPoint().getCoordinates();
          } else {
            output = formatLength({ line: geom });
            tooltipCoord = geom.getLastCoordinate();
          }

          (measureTooltipElement as HTMLDivElement).innerHTML = output;
          measureTooltip.setPosition(tooltipCoord);
        });
      });

      const listenerEnd = currentInteraction.on('drawend', () => {
        (measureTooltipElement as HTMLDivElement).id = id;
        (measureTooltipElement as HTMLDivElement).className = staticMeasureTooltipClass;
        measureTooltip.setOffset(staticMeasureTooltipOffset);
        sketch!.set('measure', id);
        sketch = null;
        measureTooltipElement = null;
        unByKey(listenerChange);
        unByKey(listenerStart);
        unByKey(listenerEnd);
      });
    }
  };

  interactions.geometry = addGeometry;
  interactions.measurement = addMeasurement;
  interactions.clear = removeInteraction;

  return interactions;
};

export const addGeometryOnMap = (session: SessionSchema, context: MapContext): void => {
  const geoJSON = new GeoJSON();
  const errorMessage = 'Can not initialize geometry';

  if (session.geometry) {
    try {
      const basicGeometryFeatures = geoJSON.readFeatures(session.geometry);
      basicGeometryFeatures.forEach(feature => {
        context.segments.draw.source.addFeature(feature);
      });
    } catch (error) {
      showMessage(errorMessage, 'error');
    }
  }

  if (session.arrows) {
    try {
      const arrowsFeatures = geoJSON.readFeatures(session.arrows);
      arrowsFeatures.forEach(feature => {
        context.segments.arrows.source.addFeature(feature);
      });
    } catch (error) {
      showMessage(errorMessage, 'error');
    }
  }

  if (session.measurements) {
    try {
      const measureFeatures = geoJSON.readFeatures(session.measurements);

      measureFeatures.forEach(feature => {
        const id = nanoid(16);
        feature.set('measure', id);
        const geometry = (feature as Feature<Geometry>).getGeometry() as LineString | Polygon;
        const isPolygon = geometry instanceof Polygon;

        context.segments.draw.source.addFeature(feature);

        const measureTooltipElement = document.createElement('div');
        measureTooltipElement.className = staticMeasureTooltipClass;
        measureTooltipElement.id = id;
        measureTooltipElement.innerHTML = isPolygon ? formatArea({ polygon: geometry }) : formatLength({ line: geometry });
        const measureTooltip = new Overlay({
          element: measureTooltipElement,
          offset: staticMeasureTooltipOffset,
          positioning: 'bottom-center',
          id
        });

        context.map.addOverlay(measureTooltip);
        const centerCoordinates = isPolygon ? geometry.getInteriorPoint().getCoordinates() : geometry.getCoordinateAt(0.5);
        measureTooltip.setPosition(centerCoordinates);
      });
    } catch (error) {
      showMessage(errorMessage, 'error');
    }
  }
};
