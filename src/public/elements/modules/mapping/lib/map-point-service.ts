import Point from 'ol/geom/Point';
import Feature from 'ol/Feature';
import { fromLonLat } from 'ol/proj';
import { getPointStyles } from './styles';
import { mapContext } from './map-service';
import { MapGroup, PointData } from '../../../../../types';

class MapPointsService {
  public add = ({ point, group }: { point: PointData, group: MapGroup }): void => {
    const createStyle = () => {
      return getPointStyles({
        highlighted: false,
        name: point.name,
        color: group.color,
        icon: group.icon
      });
    };

    const mapPoint = new Point(fromLonLat(point.coordinates));
    const iconFeature = new Feature(mapPoint);
    iconFeature.set('pointData', point);
    iconFeature.setId(point.id);

    iconFeature.set('style', createStyle());
    mapContext.segments.vector.source.addFeature(iconFeature);
  };

  public temp = ({
    point
  }: {
    point: {
      name: string,
      color: string,
      icon: string,
      coordinates: [number, number]
    }
  }): void => {
    const createStyle = () => {
      return getPointStyles({
        highlighted: false,
        name: point.name,
        color: point.color,
        icon: point.icon
      });
    };

    const mapPoint = new Point(fromLonLat(point.coordinates));
    const iconFeature = new Feature(mapPoint);
    iconFeature.set('style', createStyle());
    mapContext.segments.temp.source.addFeature(iconFeature);
  };

  public update = ({ point }: { point: PointData }) => {
    const pointFeature = mapContext.segments.vector.source.getFeatures()
      .find(feature => (feature.get('pointData') as PointData).id === point.id)!;
    (pointFeature.getGeometry() as Point).setCoordinates(fromLonLat(point.coordinates));
    pointFeature.set('pointData', point);
  };
}

export const mapPointsService = new MapPointsService();
