import axios from 'axios';
import { Graticule } from 'ol';
import BaseLayer from 'ol/layer/Base';
import StadiaMaps from 'ol/source/StadiaMaps';
import XYZ from 'ol/source/XYZ';
import { jestMockCall } from '../../../../../../tests/jest-mock-call';
import { ByPass, MapContext } from '../../../../../types';
import { showMessage } from '../../../../interface/show-message';
import { getAppConfig } from '../../../../lib/get-app-config';
import { localSettings } from '../../../../lib/local-settings';
import { layersService } from './layers-service';
import { createMapContext } from './map-service';

describe('LayersService', () => {
  beforeEach(async () => {
    (axios.get as jest.Mock).mockImplementation((path => {
      if (path === 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer?f=pjson') {
        return Promise.resolve({
          data: { copyrightText: 'sat-copyright' }
        });
      }
    }));
  });

  afterEach(() => {
    localSettings.reset();
    jest.clearAllMocks();
  });

  describe('.initialize', () => {
    test('should initialize satellite layers', async () => {
      await layersService.initialize();

      const layers = layersService.getAvailable();
      const satelliteLayers = layers.filter(layer => layer.id.startsWith('satellite'));
      expect(satelliteLayers).toHaveLength(3);
    });

    test('should initialize custom layers set by config', async () => {
      (getAppConfig as jest.Mock).mockReturnValueOnce({
        config: {
          layers: {
            enableDefault: false,
            customLayers: [
              { name: 'Layer A', url: 'https://web1.com/tile/{z}/{y}/{x}', attribution: 'Copyright 1' },
              { name: 'Layer B', url: 'https://web2.com/tile/{z}/{y}/{x}', attribution: 'Copyright 2' }
            ],
            enableSatellite: false
          }
        }
      });
      await layersService.initialize();

      const layers = layersService.getAvailable();
      expect(layers).toEqual([
        { id: 'https://web1.com/tile/{z}/{y}/{x}', title: 'Layer A', provider: [] },
        { id: 'https://web2.com/tile/{z}/{y}/{x}', title: 'Layer B', provider: [] }
      ]);
    });

    test('should not initialize custom layer set by config if pinging fails', async () => {
      (axios.head as jest.Mock).mockImplementationOnce(() => Promise.reject());

      (getAppConfig as jest.Mock).mockReturnValueOnce({
        config: {
          layers: {
            enableDefault: false,
            customLayers: [
              { name: 'Layer A', url: 'https://web1.com/tile/{z}/{y}/{x}', attribution: 'Copyright 1' },
              { name: 'Layer B', url: 'https://web2.com/tile/{z}/{y}/{x}', attribution: 'Copyright 2' }
            ],
            enableSatellite: false
          }
        }
      });
      await layersService.initialize();

      const layers = layersService.getAvailable();
      expect(layers).toEqual([
        { id: 'https://web2.com/tile/{z}/{y}/{x}', title: 'Layer B', provider: [] }
      ]);

      expect(showMessage).toBeCalledTimes(1);
      expect(showMessage).toHaveBeenCalledWith('Can not initialize layer "Layer A"', 'error');
    });

    test('should not initialize any layers and keep system one with message to user', async () => {
      (getAppConfig as jest.Mock).mockReturnValueOnce({
        config: {
          layers: {
            enableDefault: false,
            customLayers: [],
            enableSatellite: false
          }
        }
      });
      expect(showMessage).toBeCalledTimes(0);
      await layersService.initialize();

      const layers = layersService.getAvailable();
      expect(layers).toHaveLength(1);
      expect(layersService.getCurrent()).toBe('stamen_toner');
      expect(showMessage).toBeCalledTimes(1);
      expect(showMessage).toHaveBeenCalledWith('No layers initialized within the system', 'error');
    });

    test('should not initialize satellite layers if fails for any reason', async () => {
      (axios.get as jest.Mock).mockImplementationOnce(() => Promise.reject());
      await layersService.initialize();

      const layers = layersService.getAvailable();
      const satelliteLayers = layers.filter(layer => layer.id.startsWith('satellite'));
      expect(satelliteLayers).toHaveLength(0);
    });

    test('should not initialize default layers when set by config', async () => {
      (getAppConfig as jest.Mock).mockReturnValueOnce({
        config: {
          layers: {
            enableDefault: false,
            customLayers: [],
            enableSatellite: true
          }
        }
      });
      await layersService.initialize();

      const layers = layersService.getAvailable();
      expect(layers).toHaveLength(3);
      const satelliteLayers = layers.filter(layer => layer.id.startsWith('satellite'));
      expect(satelliteLayers).toHaveLength(3);
    });

    test('should read default layer from local settings and set if available', async () => {
      localSettings.set('defaultLayerId', 'stamen_toner_background');

      await layersService.initialize();

      expect(layersService.getCurrent()).toBe('stamen_toner_background');
    });

    test('should revert default layer to the first available if the one in local settings is not available', async () => {
      (getAppConfig as jest.Mock).mockReturnValueOnce({
        config: {
          layers: {
            enableDefault: false,
            customLayers: [
              { name: 'Layer A', url: 'https://web1.com/tile/{z}/{y}/{x}', attribution: 'Copyright 1' },
              { name: 'Layer B', url: 'https://web2.com/tile/{z}/{y}/{x}', attribution: 'Copyright 2' }
            ],
            enableSatellite: false
          }
        }
      });
      localSettings.set('defaultLayerId', 'random');

      await layersService.initialize();

      expect(layersService.getCurrent()).toBe('https://web1.com/tile/{z}/{y}/{x}');
    });
  });

  describe('.select', () => {
    let mapContext: MapContext;

    class ResizeObserver {
      constructor() {}
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    global.ResizeObserver = ResizeObserver;

    beforeEach(async () => {
      document.getElementById = (id: string) => {
        const target = document.createElement('div');
        target.id = id;

        return target;
      };

      (getAppConfig as jest.Mock).mockReturnValueOnce({
        config: {
          layers: {
            enableDefault: true,
            customLayers: [
              { name: 'Layer A', url: 'https://web1.com/tile/{z}/{y}/{x}', attribution: 'Copyright 1' },
              { name: 'Layer B', url: 'https://web2.com/tile/{z}/{y}/{x}', attribution: 'Copyright 2' }
            ],
            enableSatellite: false
          }
        }
      });
      (layersService as ByPass).currentLayer = 'stamen_toner';
      mapContext = createMapContext('map-container');
      await mapContext.initializing;

      mapContext.map.setLayerGroup = jest.fn();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('should select given default layer', async () => {
      expect(layersService.getCurrent()).toBe('stamen_toner');

      layersService.select({ baseLayerId: 'stamen_toner_background', mapContext });

      expect(layersService.getCurrent()).toBe('stamen_toner_background');

      expect(mapContext.map.setLayerGroup).toBeCalledTimes(1);

      const layersGroup = jestMockCall(mapContext.map.setLayerGroup)[0][0];
      const layerSources = layersGroup.getLayers().getArray()
        .map((layer: BaseLayer) => layer.getLayersArray()[0].getSource());

      expect(layerSources[0] instanceof StadiaMaps).toBe(true);
      expect(layerSources[0].getUrls()[0].includes('stamen_toner_background')).toBe(true);

      expect(layerSources[1]).toBe(mapContext.segments.draw.source);
      expect(layerSources[2]).toBe(mapContext.segments.arrows.source);
      expect(layerSources[3]).toBe(mapContext.segments.temp.source);
      expect(layerSources[4]).toBe(mapContext.segments.vector.source);
    });

    test('should select given satellite based layer - satellite', async () => {
      expect(layersService.getCurrent()).toBe('stamen_toner');

      layersService.select({ baseLayerId: 'satellite', mapContext });

      expect(layersService.getCurrent()).toBe('satellite');

      expect(mapContext.map.setLayerGroup).toBeCalledTimes(1);

      const layersGroup = jestMockCall(mapContext.map.setLayerGroup)[0][0];
      const layerSources = layersGroup.getLayers().getArray()
        .map((layer: BaseLayer) => layer.getLayersArray()[0].getSource());

      expect(layerSources[0] instanceof XYZ).toBe(true);
      expect(layerSources[0].getUrls()[0].includes('arcgisonline')).toBe(true);

      expect(layerSources[1] instanceof StadiaMaps).toBe(true);
      expect(layerSources[1].getUrls()[0].includes('stamen_toner_labels')).toBe(true);

      expect(layerSources[2]).toBe(mapContext.segments.draw.source);
      expect(layerSources[3]).toBe(mapContext.segments.arrows.source);
      expect(layerSources[4]).toBe(mapContext.segments.temp.source);
      expect(layerSources[5]).toBe(mapContext.segments.vector.source);
    });

    test('should select given satellite based layer - satellite_hybrid', async () => {
      expect(layersService.getCurrent()).toBe('stamen_toner');

      layersService.select({ baseLayerId: 'satellite_hybrid', mapContext });

      expect(layersService.getCurrent()).toBe('satellite_hybrid');

      expect(mapContext.map.setLayerGroup).toBeCalledTimes(1);

      const layersGroup = jestMockCall(mapContext.map.setLayerGroup)[0][0];
      const layerSources = layersGroup.getLayers().getArray()
        .map((layer: BaseLayer) => layer.getLayersArray()[0].getSource());

      expect(layerSources[0] instanceof XYZ).toBe(true);
      expect(layerSources[0].getUrls()[0].includes('arcgisonline')).toBe(true);

      expect(layerSources[1] instanceof StadiaMaps).toBe(true);
      expect(layerSources[1].getUrls()[0].includes('stamen_toner_lines')).toBe(true);

      expect(layerSources[2] instanceof StadiaMaps).toBe(true);
      expect(layerSources[2].getUrls()[0].includes('stamen_toner_labels')).toBe(true);

      expect(layerSources[3]).toBe(mapContext.segments.draw.source);
      expect(layerSources[4]).toBe(mapContext.segments.arrows.source);
      expect(layerSources[5]).toBe(mapContext.segments.temp.source);
      expect(layerSources[6]).toBe(mapContext.segments.vector.source);
    });

    test('should select given satellite based layer - satellite_background', async () => {
      expect(layersService.getCurrent()).toBe('stamen_toner');

      layersService.select({ baseLayerId: 'satellite_background', mapContext });

      expect(layersService.getCurrent()).toBe('satellite_background');

      expect(mapContext.map.setLayerGroup).toBeCalledTimes(1);

      const layersGroup = jestMockCall(mapContext.map.setLayerGroup)[0][0];
      const layerSources = layersGroup.getLayers().getArray()
        .map((layer: BaseLayer) => layer.getLayersArray()[0].getSource());

      expect(layerSources[0] instanceof XYZ).toBe(true);
      expect(layerSources[0].getUrls()[0].includes('arcgisonline')).toBe(true);

      expect(layerSources[1]).toBe(mapContext.segments.draw.source);
      expect(layerSources[2]).toBe(mapContext.segments.arrows.source);
      expect(layerSources[3]).toBe(mapContext.segments.temp.source);
      expect(layerSources[4]).toBe(mapContext.segments.vector.source);
    });

    test('should select given custom layer', async () => {
      expect(layersService.getCurrent()).toBe('stamen_toner');

      layersService.select({ baseLayerId: 'https://web1.com/tile/{z}/{y}/{x}', mapContext });

      expect(layersService.getCurrent()).toBe('https://web1.com/tile/{z}/{y}/{x}');

      expect(mapContext.map.setLayerGroup).toBeCalledTimes(1);

      const layersGroup = jestMockCall(mapContext.map.setLayerGroup)[0][0];
      const layerSources = layersGroup.getLayers().getArray()
        .map((layer: BaseLayer) => layer.getLayersArray()[0].getSource());

      expect(layerSources[0] instanceof XYZ).toBe(true);
      expect(layerSources[0].getUrls()[0]).toBe('https://web1.com/tile/{z}/{y}/{x}');

      expect(layerSources[1]).toBe(mapContext.segments.draw.source);
      expect(layerSources[2]).toBe(mapContext.segments.arrows.source);
      expect(layerSources[3]).toBe(mapContext.segments.temp.source);
      expect(layerSources[4]).toBe(mapContext.segments.vector.source);
    });

    test('should enable graticule', async () => {
      expect(layersService.getCurrent()).toBe('stamen_toner');

      layersService.select({ baseLayerId: 'stamen_toner', mapContext, graticule: true });

      expect(layersService.getCurrent()).toBe('stamen_toner');

      expect(mapContext.map.setLayerGroup).toBeCalledTimes(1);

      const layersGroup = jestMockCall(mapContext.map.setLayerGroup)[0][0];
      const layerSources = layersGroup.getLayers().getArray()
        .map((layer: BaseLayer) => layer.getLayersArray()[0].getSource());

      expect(layerSources[0] instanceof StadiaMaps).toBe(true);
      expect(layersGroup.getLayers().getArray()[1] instanceof Graticule).toBe(true);

      expect(layerSources[2]).toBe(mapContext.segments.draw.source);
      expect(layerSources[3]).toBe(mapContext.segments.arrows.source);
      expect(layerSources[4]).toBe(mapContext.segments.temp.source);
      expect(layerSources[5]).toBe(mapContext.segments.vector.source);
    });

    test('should set selected layer on local settings', () => {
      expect(localSettings.get('defaultLayerId')).toBe('stamen_toner');

      layersService.select({ baseLayerId: 'stamen_toner_background', mapContext });

      expect(localSettings.get('defaultLayerId')).toBe('stamen_toner_background');
    });
  });
});
