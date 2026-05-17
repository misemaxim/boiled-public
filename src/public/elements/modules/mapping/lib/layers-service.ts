import TileLayer from 'ol/layer/Tile.js';
import LayerGroup from 'ol/layer/Group';
import StadiaMaps from 'ol/source/StadiaMaps';
import { CustomLayer, MapContext } from '../../../../../types';
import XYZ from 'ol/source/XYZ';
import axios from 'axios';
import Graticule from 'ol/layer/Graticule';
import Stroke from 'ol/style/Stroke';
import { showMessage } from '../../../../interface/show-message';
import { localSettings } from '../../../../lib/local-settings';
import { isPublicMode } from '../lib/is-public-mode';
import { getAppConfig } from '../../../../lib/get-app-config';

class LayersService {
  private customLayers: CustomLayer[] = [];
  private satelliteLayer?: TileLayer<XYZ>;
  private providerStadia = {
    name: 'Stadia Maps',
    link: 'https://docs.stadiamaps.com/themes'
  };
  private providerArcGIS = {
    name: 'ArcGIS',
    link: 'https://developers.arcgis.com/documentation/mapping-apis-and-services/data-hosting/services/image-tile-service'
  };
  private systemLayer = { id: 'stamen_toner', title: 'Stamen Toner', provider: [this.providerStadia] };
  private defaultLayers = [this.systemLayer];
  private currentLayer = this.systemLayer.id;
  // https://developers.arcgis.com/documentation/mapping-apis-and-services/data-hosting/services/image-tile-service/
  private getSatelliteLayer = async () => {
    try {
      const resp = await axios.get('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer?f=pjson');
      return new TileLayer({
        source: new XYZ({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attributions: `Map tiles by ©
          <a
            rel="noreferrer noopener"
            target="_blank"
            href="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
          >
            ArcGIS
          </a> - ${resp.data.copyrightText}.`,
          crossOrigin: '*'
        })
      });
    } catch (error) {
      return undefined;
    }
  };

  private customLayerPing = async (url: string) => {
    try {
      await axios.head(url);
      return true;
    } catch (error) {
      return false;
    }
  };
  public async initialize() {
    const config = getAppConfig().config;
    const initializedLayers: typeof this.defaultLayers = [];

    if (config.layers.enableDefault) {
      initializedLayers.push(
        this.systemLayer,
        { id: 'stamen_toner_background', title: 'Stamen Toner Background', provider: [this.providerStadia] },
        { id: 'stamen_toner_lite', title: 'Stamen Toner Lite', provider: [this.providerStadia] },
        { id: 'stamen_terrain', title: 'Stamen Terrain', provider: [this.providerStadia] },
        { id: 'stamen_terrain_background', title: 'Stamen Terrain Background', provider: [this.providerStadia] }
      );
    }

    if (config.layers.enableSatellite) {
      this.satelliteLayer = await this.getSatelliteLayer();
      if (this.satelliteLayer) {
        initializedLayers.push(
          { id: 'satellite', title: 'Satellite', provider: [this.providerStadia, this.providerArcGIS] },
          { id: 'satellite_background', title: 'Satellite Background', provider: [this.providerArcGIS] },
          { id: 'satellite_hybrid', title: 'Satellite Hybrid', provider: [this.providerStadia, this.providerArcGIS] }
        );
      }
    }

    this.customLayers = [];
    if (config.layers.customLayers) {
      for (const layer of config.layers.customLayers) {
        if (await this.customLayerPing(layer.url)) {
          this.customLayers.push(layer);
        } else {
          showMessage(`Can not initialize layer "${layer.name}"`, 'error');
        }
      }
    }

    if (!initializedLayers.length && !this.customLayers.length) {
      if (!isPublicMode()) {
        showMessage('No layers initialized within the system', 'error');
      }

      this.defaultLayers = [this.systemLayer];
      this.currentLayer = this.systemLayer.id;
    } else {
      this.defaultLayers = initializedLayers;
      const availableLayers = this.getAvailable().map(layer => layer.id);
      const defaultLayerId = localSettings.get<string>('defaultLayerId');

      this.currentLayer = availableLayers.includes(defaultLayerId) ? defaultLayerId : availableLayers[0];
    }
  }

  public getAvailable = () => {
    return this.defaultLayers
      .concat(this.customLayers.map(layer => ({ id: layer.url, title: layer.name, provider: [] })));
  };

  public getCurrent = () => {
    return this.currentLayer;
  };

  public getMapLayerSet = (baseLayerId: string) => {
    let layers: (TileLayer<XYZ> | TileLayer<StadiaMaps>)[];

    const customLayer = this.customLayers.find(layer => layer.url === baseLayerId);
    if (customLayer) {
      const layer = new TileLayer({
        source: new XYZ({
          url: customLayer.url,
          attributions: customLayer.attribution,
          crossOrigin: '*'
        })
      });

      layers = [layer];
    } else if (baseLayerId === 'satellite' && this.satelliteLayer) {
      const labelsLayer = new TileLayer({ source: new StadiaMaps({ layer: 'stamen_toner_labels', retina: true, apiKey: '' }) });
      layers = [this.satelliteLayer, labelsLayer];
    } else if (baseLayerId === 'satellite_hybrid' && this.satelliteLayer) {
      const labelsLayer = new TileLayer({ source: new StadiaMaps({ layer: 'stamen_toner_labels', retina: true, apiKey: '' }) });
      const linesLayer = new TileLayer({ source: new StadiaMaps({ layer: 'stamen_toner_lines', retina: true, apiKey: '' }) });
      layers = [this.satelliteLayer, linesLayer, labelsLayer];
    } else if (baseLayerId === 'satellite_background' && this.satelliteLayer) {
      layers = [this.satelliteLayer];
    } else {
      const newGraphicView = new TileLayer({ source: new StadiaMaps({ layer: baseLayerId, retina: true, apiKey: '' }) });
      layers = [newGraphicView];
    }

    return layers;
  };

  public select({
    baseLayerId,
    mapContext,
    graticule
  }: {
    baseLayerId: string;
    mapContext: MapContext;
    graticule?: boolean;
  }) {
    this.currentLayer = baseLayerId;
    localSettings.set('defaultLayerId', baseLayerId);

    const graticuleLayer = new Graticule({
      strokeStyle: new Stroke({
        color: '#B50000',
        width: 2,
        lineDash: [0.5, 4]
      }),
      showLabels: true
    });

    const baseLayers = [
      mapContext.segments.draw.view,
      mapContext.segments.arrows.view,
      mapContext.segments.temp.view,
      mapContext.segments.vector.view
    ];

    const layers = [...this.getMapLayerSet(baseLayerId), ...baseLayers];
    if (graticule) {
      layers.splice(1, 0, graticuleLayer);
    }

    const layerGroup = new LayerGroup({ layers });
    mapContext.map.setLayerGroup(layerGroup);
  }
}

export const layersService = new LayersService();