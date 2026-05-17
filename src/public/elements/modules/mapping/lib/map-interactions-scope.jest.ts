import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';
import { Draw } from 'ol/interaction';
import Style from 'ol/style/Style';
import { jestMockCall } from '../../../../../../tests/jest-mock-call';
import { ByPass, MapContext } from '../../../../../types';
import { sessionManager } from '../../../../lib/session-manager';
import {
  addGeometryOnMap,
  createMapInteractionsScope,
  dynamicMeasureTooltipClass,
  getIndexedGeometry,
  staticMeasureTooltipClass
} from './map-interactions-scope';
import { createMapContext } from './map-service';
import { MeasureStyle } from './styles';

describe('createMapInteractionsScope', () => {
  let target: HTMLDivElement;
  let mapContext: MapContext;
  let mapInteractionsScope: MapContext['interactions'];

  class ResizeObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  global.ResizeObserver = ResizeObserver;

  beforeEach(() => {
    jest.useFakeTimers();

    document.getElementById = (id: string) => {
      target = document.createElement('div');
      target.id = id;

      return target;
    };

    mapContext = createMapContext('map-container');
    mapInteractionsScope = createMapInteractionsScope(
      mapContext.map,
      [
        mapContext.segments.draw.source,
        mapContext.segments.arrows.source
      ]
    );

    mapContext.map.addInteraction = jest.fn();
    mapContext.map.removeInteraction = jest.fn();
    mapContext.map.addOverlay = jest.fn();
    mapContext.map.removeInteraction = jest.fn();
  });

  afterEach(() => {
    mapContext.interactions.clear();

    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('.geometry', () => {
    test('should invoke adding of geometry', () => {
      mapInteractionsScope.geometry('Circle');

      expect(mapContext.map.addInteraction).toBeCalledTimes(1);
      const interaction = jestMockCall(mapContext.map.addInteraction)[0][0];
      expect(interaction instanceof Draw).toBe(true);
      expect(interaction.type_).toBe('Circle');
      expect(interaction.source_).toBe(mapContext.segments.draw.source);
    });

    test('should invoke adding of arrow geometry', () => {
      mapInteractionsScope.geometry('ArrowString');

      expect(mapContext.map.addInteraction).toBeCalledTimes(1);
      const interaction = jestMockCall(mapContext.map.addInteraction)[0][0];
      expect(interaction instanceof Draw).toBe(true);
      expect(interaction.type_).toBe('LineString');
      expect(interaction.source_).toBe(mapContext.segments.arrows.source);
    });

    test('should add listener on end of interaction to update session', () => {
      mapInteractionsScope.geometry('Circle');

      const interaction = jestMockCall(mapContext.map.addInteraction)[0][0];
      const callback = interaction.listeners_.drawend[0];
      callback();

      jest.advanceTimersByTime(500);

      expect(sessionManager.index).toBeCalledTimes(1);
      const indexedGeometry = jestMockCall(sessionManager.index)[0][0];
      expect(indexedGeometry)
        .toEqual(getIndexedGeometry([mapContext.segments.draw.source, mapContext.segments.arrows.source]));
    });

    test('should remove previous interaction when start adding new one', () => {
      mapInteractionsScope.geometry('Polygon');

      const interaction = jestMockCall(mapContext.map.addInteraction)[0][0];
      expect(interaction.type_).toBe('Polygon');

      mapInteractionsScope.geometry('Circle');

      expect(mapContext.map.removeInteraction).toBeCalledTimes(1);
      expect(mapContext.map.removeInteraction).toHaveBeenCalledWith(interaction);
    });

    test('should remove current interaction when start adding the same one', () => {
      mapInteractionsScope.geometry('Polygon');

      const interaction = jestMockCall(mapContext.map.addInteraction)[0][0];
      expect(interaction.type_).toBe('Polygon');

      mapInteractionsScope.geometry('Polygon');

      expect(mapContext.map.removeInteraction).toBeCalledTimes(1);
      expect(mapContext.map.removeInteraction).toHaveBeenCalledWith(interaction);
    });

    test('should remove current interaction when called without interaction', () => {
      mapInteractionsScope.geometry('Polygon');

      const interaction = jestMockCall(mapContext.map.addInteraction)[0][0];
      expect(interaction.type_).toBe('Polygon');

      mapInteractionsScope.geometry(null);

      expect(mapContext.map.removeInteraction).toBeCalledTimes(1);
      expect(mapContext.map.removeInteraction).toHaveBeenCalledWith(interaction);
    });
  });

  describe('.measurement', () => {
    test('should invoke adding of measurement', () => {
      jest.clearAllMocks();

      mapInteractionsScope.measurement('LineString#measurement');

      expect(mapContext.map.addInteraction).toBeCalledTimes(1);
      const interaction = jestMockCall(mapContext.map.addInteraction)[0][0];
      expect(interaction instanceof Draw).toBe(true);
      expect(interaction.type_).toBe('LineString');
      expect(interaction.source_).toBe(mapContext.segments.draw.source);

      expect(interaction.overlay_.style_).toMatchObject(new Style(MeasureStyle));

      expect(mapContext.map.addOverlay).toBeCalledTimes(1);
      const tooltip = jestMockCall(mapContext.map.addOverlay)[0][0];

      expect(tooltip.options.element.className).toBe(dynamicMeasureTooltipClass);
    });

    test('should add listener on start of interaction to track measurement', () => {
      jest.clearAllMocks();

      mapInteractionsScope.measurement('LineString#measurement');

      const tooltip = jestMockCall(mapContext.map.addOverlay)[0][0];
      tooltip.setPosition = jest.fn();
      expect(tooltip.options.element.innerHTML).toBe('');

      expect(mapContext.map.addInteraction).toBeCalledTimes(1);
      const interaction = jestMockCall(mapContext.map.addInteraction)[0][0];
      const feature = new Feature({ geometry: new Point([1, 2]) });
      const callback = interaction.listeners_.drawstart[0];
      callback({ feature });

      const change = (feature.getGeometry() as ByPass).listeners_.change[1];
      const geojson = new GeoJSON();
      change({
        target: geojson.readGeometry({
          type: 'LineString',
          coordinates: [
            [2397065.207023127, 2896046.127668758],
            [3003669.463494286, 939258.2035682453]
          ]
        })
      });

      expect(tooltip.options.element.innerHTML).toBe('1950.83 km');

      expect(tooltip.setPosition).toBeCalledTimes(1);
      expect(tooltip.setPosition).toHaveBeenCalledWith([3003669.463494286, 939258.2035682453]);
    });

    test('should add listener on end of interaction to wrap measurement', () => {
      jest.clearAllMocks();

      mapInteractionsScope.measurement('LineString#measurement');

      const tooltip = jestMockCall(mapContext.map.addOverlay)[0][0];
      tooltip.setPosition = jest.fn();

      const interaction = jestMockCall(mapContext.map.addInteraction)[0][0];
      const feature = new Feature({ geometry: new Point([1, 2]) });
      const startCallback = interaction.listeners_.drawstart[0];
      startCallback({ feature });
      const endCallback = interaction.listeners_.drawend[1];
      endCallback();

      expect(tooltip.id.startsWith('measure#')).toBe(true);
      expect(tooltip.options.element.id).toBe(tooltip.id);
      expect(tooltip.options.element.className).toBe(staticMeasureTooltipClass);

      expect(feature.get('measure')).toBe(tooltip.id);
    });

    test('should add listener on end of interaction to update session', () => {
      mapInteractionsScope.measurement('LineString#measurement');

      const interaction = jestMockCall(mapContext.map.addInteraction)[0][0];
      const callback = interaction.listeners_.drawend[0];
      callback();

      jest.advanceTimersByTime(500);

      expect(sessionManager.index).toBeCalledTimes(1);
      const indexedGeometry = jestMockCall(sessionManager.index)[0][0];
      expect(indexedGeometry)
        .toEqual(getIndexedGeometry([mapContext.segments.draw.source, mapContext.segments.arrows.source]));
    });

    test('should remove previous interaction when start adding new one', () => {
      mapInteractionsScope.measurement('LineString#measurement');

      const interaction = jestMockCall(mapContext.map.addInteraction)[0][0];
      expect(interaction.type_).toBe('LineString');

      mapInteractionsScope.measurement('Polygon#measurement');

      expect(mapContext.map.removeInteraction).toBeCalledTimes(1);
      expect(mapContext.map.removeInteraction).toHaveBeenCalledWith(interaction);
    });

    test('should remove current interaction when start adding the same one', () => {
      mapInteractionsScope.measurement('LineString#measurement');

      const interaction = jestMockCall(mapContext.map.addInteraction)[0][0];
      expect(interaction.type_).toBe('LineString');

      mapInteractionsScope.measurement('LineString#measurement');

      expect(mapContext.map.removeInteraction).toBeCalledTimes(1);
      expect(mapContext.map.removeInteraction).toHaveBeenCalledWith(interaction);
    });

    test('should remove current interaction when called without interaction', () => {
      mapInteractionsScope.measurement('LineString#measurement');

      const interaction = jestMockCall(mapContext.map.addInteraction)[0][0];
      expect(interaction.type_).toBe('LineString');

      mapInteractionsScope.measurement(null);

      expect(mapContext.map.removeInteraction).toBeCalledTimes(1);
      expect(mapContext.map.removeInteraction).toHaveBeenCalledWith(interaction);
    });
  });
});

describe('addGeometryOnMap', () => {
  let target: HTMLDivElement;
  let mapContext: MapContext;

  class ResizeObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  global.ResizeObserver = ResizeObserver;

  beforeEach(async () => {
    jest.useFakeTimers();

    document.getElementById = (id: string) => {
      target = document.createElement('div');
      target.id = id;

      return target;
    };

    mapContext = createMapContext('map-container');
    await mapContext.initializing;
    jest.clearAllMocks();
    jest.restoreAllMocks();

    mapContext.map.addOverlay = jest.fn();
    mapContext.segments.draw.source.addFeature = jest.fn();
    mapContext.segments.arrows.source.addFeature = jest.fn();

    addGeometryOnMap(sessionManager.get(), mapContext);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  test('should add existing objects on map', () => {
    const session = sessionManager.get();
    const geoJSON = new GeoJSON();

    expect(mapContext.segments.draw.source.addFeature).toBeCalledTimes(3);
    const addCalback1 = jestMockCall(mapContext.segments.draw.source.addFeature)[0][0];
    const addCalback2 = jestMockCall(mapContext.segments.draw.source.addFeature)[1][0];
    const addCalback3 = jestMockCall(mapContext.segments.draw.source.addFeature)[2][0];

    expect(addCalback1.getGeometry().flatCoordinates)
      .toEqual((geoJSON.readFeatures(session.geometry)[0].getGeometry() as LineString).getFlatCoordinates());
    expect(addCalback2.getGeometry().flatCoordinates)
      .toEqual((geoJSON.readFeatures(session.geometry)[1].getGeometry() as LineString).getFlatCoordinates());
    expect(addCalback3.getGeometry().flatCoordinates)
      .toEqual((geoJSON.readFeatures(session.measurements)[0].getGeometry() as LineString).getFlatCoordinates());

    expect(mapContext.map.addOverlay).toBeCalledTimes(1);
    const tooltip = jestMockCall(mapContext.map.addOverlay)[0][0];
    expect(tooltip.options.element.className).toBe(staticMeasureTooltipClass);
    expect(tooltip.options.element.innerHTML).toBe('4623.91 km');
  });
});
