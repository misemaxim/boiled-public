import Map from 'ol/Map';
import View from 'ol/View';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { defaults as defaultInteractions } from 'ol/interaction';
import { drawLayerStyle, arrowsLayerStyle } from './styles';
import { getMinZoom } from './get-min-zoom';
import { setMapEvents } from './map-events';
import { createMapMethods } from './map-methods';
import { mapPointsService } from './map-point-service';
import { sessionManager } from '../../../../lib/session-manager';
import { layersService } from './layers-service';
import { createMapInteractionsScope, addGeometryOnMap } from './map-interactions-scope';
import { noop } from 'lodash';
import { MapContext, MapGroup, PluginTypes, PointData } from '../../../../../types';
import { nanoid } from 'nanoid';
import { StyleLike } from 'ol/style/Style';
import { pluginsManager } from '../../plugins/lib/plugins-manager';

let intervalToReInitMap: NodeJS.Timeout | undefined;

const invokeRefreshPlugins = async () => {
  const plugins = sessionManager.plugins.get()[PluginTypes.Refresh];

  for (const plugin of plugins) {
    await pluginsManager.evaluate(plugin._id);
  }
};

export let mapContext: MapContext;

export const createMapContext = (container: string) => {
  const vectorSource = new VectorSource({
    features: [],
    attributions: '© Boiled - Cartography Notepad'
  });
  vectorSource.set('id', 'vector');
  const drawSource = new VectorSource({ wrapX: false });
  drawSource.set('id', 'draw');
  const arrowsSource = new VectorSource({ wrapX: false });
  arrowsSource.set('id', 'arrows');
  const tempSource = new VectorSource({ features: [] });
  tempSource.set('id', 'temp');

  const graphicView = layersService.getMapLayerSet(layersService.getCurrent());
  const vectorView = new VectorLayer({ style: (feature) => feature.get('style'), source: vectorSource });
  const drawView = new VectorLayer({
    source: drawSource,
    style: drawLayerStyle as unknown as StyleLike
  });
  const tempView = new VectorLayer({ style: (feature) => feature.get('style'), source: tempSource });
  const arrowsView = new VectorLayer({
    source: arrowsSource,
    style: arrowsLayerStyle as unknown as StyleLike
  });

  const initialZoom = getMinZoom(container).byWidth;

  const view = new View({
    center: [0, 0],
    minZoom: initialZoom,
    zoom: initialZoom
  });

  const map = new Map({
    layers: [...graphicView, drawView, arrowsView, tempView, vectorView],
    target: container,
    view,
    interactions: defaultInteractions({
      dragPan: false
    })
  });

  setMapEvents(map);
  const methods = createMapMethods(map);
  let fullInitializing = noop;

  const context = {
    initializing: new Promise(resolve => fullInitializing = resolve),
    interactions: createMapInteractionsScope(map, [drawSource, arrowsSource]),
    segments: {
      vector: { source: vectorSource, view: vectorView },
      draw: { source: drawSource, view: drawView },
      arrows: { source: arrowsSource, view: arrowsView },
      temp: { source: tempSource, view: tempView }
    },
    methods,
    groups: {
      add: (preset: Omit<MapGroup, 'id' | 'created'>) => {
        const session = sessionManager.get();

        session.groups.push({
          id: nanoid(16),
          created: Date.now(),
          ...preset
        });

        sessionManager.index(session);
      },
      update: (group: MapGroup) => {
        const session = sessionManager.get();

        let withRefresh = false;
        session.groups.find((g, index) => {
          if (g.id === group.id) {
            withRefresh = true;
            session.groups[index] = group;
          } else {
            return false;
          }
        });

        sessionManager.index(session);

        if (withRefresh) {
          mapContext.refresh.run(false);
        }
      },
      delete: (id: string) => {
        const features = context.segments.vector.source.getFeatures();
        for (const feature of features) {
          const pointData = feature.get('pointData') as PointData | undefined;
          if (pointData && pointData.group === id) {
            context.segments.vector.source.removeFeature(feature);
          }
        }

        const session = sessionManager.get();
        delete session.points[id];
        session.groups = session.groups.filter(g => g.id !== id);

        sessionManager.index(session);
      }
    },
    points: {
      add: (preset: Omit<PointData, 'id' | 'created'>) => {
        const pointData = {
          id: nanoid(16),
          created: Date.now(),
          ...preset
        };

        const session = sessionManager.get();

        if (!session.points[pointData.group]) {
          session.points[pointData.group] = [];
        }

        session.points[pointData.group].push(pointData);

        const group = session.groups.find(group => group.id === pointData.group) as MapGroup;

        mapPointsService.add({ point: pointData, group });

        sessionManager.index(session);
      },
      update: (point: PointData) => {
        const session = sessionManager.get();
        const pointInSessionIndex = session.points[point.group].findIndex(p => p.id === point.id);

        if (pointInSessionIndex !== -1) {
          const withRefresh = session.points[point.group][pointInSessionIndex].name !== point.name;

          mapPointsService.update({ point });
          session.points[point.group][pointInSessionIndex] = point;

          sessionManager.index(session);

          if (withRefresh) {
            mapContext.refresh.run(false);
          }
        }
      },
      delete: (id: [groupId: string, pointId: string]) => {
        const session = sessionManager.get();
        session.points[id[0]] = session.points[id[0]].filter(p => p.id !== id[1]);

        const feature = context.segments.vector.source.getFeatureById(id[1])!;
        context.segments.vector.source.removeFeature(feature);

        sessionManager.index(session);
      }
    },
    layers: {
      getCurrent: () => layersService.getCurrent(),
      getAvailable: () => layersService.getAvailable(),
      select: (baseLayerId: string) => {
        layersService.select({
          baseLayerId,
          mapContext
        });
      },
      toggleGraticule: (graticuleIsSet: boolean) => {
        if (!graticuleIsSet) {
          layersService.select({
            baseLayerId: layersService.getCurrent(),
            mapContext,
            graticule: false
          });
        } else {
          layersService.select({
            baseLayerId: layersService.getCurrent(),
            mapContext,
            graticule: true
          });
        }
      }
    },
    refresh: {
      run: (withPlugins = true) => {
        if (withPlugins) {
          invokeRefreshPlugins();
        }

        const session = sessionManager.get();

        Object.values(mapContext.segments).forEach(segment => {
          segment.source.clear();
        });

        session.groups.forEach(group => {
          if (session.points[group.id]) {
            session.points[group.id].forEach(point => {
              mapPointsService.add({ point, group });
            });
          }
        });

        addGeometryOnMap(session, mapContext);
      },
      auto: (interval: number | null) => {
        if (!interval) {
          clearInterval(intervalToReInitMap);
          intervalToReInitMap = undefined;
          return;
        }

        intervalToReInitMap = setInterval(() => {
          mapContext.refresh.run();
        }, interval * 1000);
      },
      isAuto: () => !!intervalToReInitMap
    },
    map
  };

  sessionManager.check()
    .then(async session => {
      session.groups.forEach(group => {
        if (session.points[group.id]) {
          session.points[group.id].forEach(point => {
            mapPointsService.add({ point, group });
          });
        }
      });

      addGeometryOnMap(session, context);

      await layersService.initialize();
      context.layers.select(context.layers.getCurrent());

      fullInitializing();
    });

  mapContext = context;
  return context;
};
