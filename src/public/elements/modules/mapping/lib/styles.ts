import { Circle, Fill, Icon, Stroke, Style, Text } from 'ol/style';
import Point from 'ol/geom/Point';
import { iconUrl } from '../elements/icon';
import { LineString } from 'ol/geom';
import Feature from 'ol/Feature';
import { Coordinate } from 'ol/coordinate';
import CircleStyle from 'ol/style/Circle';

export const arrowsLayerStyle = (feature: Feature<LineString>): Style[] => {
  const geometry = feature.getGeometry()!;
  const styles = [
    new Style({
      stroke: new Stroke({
        color: '#1aaebf',
        width: 2
      })
    })
  ];

  geometry.forEachSegment((start: Coordinate, end: Coordinate) => {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const rotation = Math.atan2(dy, dx);
    styles.push(new Style({
      geometry: new Point(end),
      image: new Icon({
        opacity: 1,
        src: iconUrl('player-play-filled', '#1aaebf'),
        scale: 1.2,
        rotation: -rotation
      })
    }));
  });

  return styles;
};

export const GeometryStyle = {
  fill: new Fill({
    color: 'rgba(26, 174, 191, 0.5)'
  }),
  stroke: new Stroke({
    color: '#1aaebf',
    lineDash: [],
    width: 2
  }),
  image: new CircleStyle({
    radius: 5,
    fill: new Fill({
      color: '#1aaebf'
    })
  })
};

export const MeasureStyle = {
  fill: new Fill({
    color: 'rgba(255, 140, 0, 0.5)'
  }),
  stroke: new Stroke({
    color: '#ff8c00',
    lineDash: [10, 10],
    width: 2
  }),
  image: new CircleStyle({
    radius: 5,
    // stroke: new Stroke({
    //   color: '#ff8c00'
    // }),
    fill: new Fill({
      color: '#ff8c00'
    })
  })
};

export const getPointStyles = ({
  highlighted,
  name,
  icon,
  color
}: {
  highlighted: boolean;
  name: string;
  icon: string;
  color: string;
}) => {
  return [
    new Style({
      image: new Circle({
        radius: 18, // size of the shield
        fill: new Fill({
          color: '#000000'
        })
      })
    }),
    new Style({
      image: new Icon({
        opacity: 1,
        src: iconUrl(icon, color)
      })
    }),
    name ? new Style({
      text: new Text({
        text: name && name.length > 10 ? name.substring(0, 10) + '...' : name,
        font: 'normal 14px "Roboto Flex"',
        fill: new Fill({
          color: highlighted ? '#000000' : '#e0f2f1'
        }),
        backgroundFill: new Fill({
          color: highlighted ? '#ff6d00' : '#000000'
        }),
        backgroundStroke: new Stroke({
          color: 'rgba(0,0,0,0.35)',
          width: 1
        }),
        offsetY: 32,
        padding: [4, 6, 4, 6]
      })
    }) : null
  ].filter(style => style);
};

export const drawLayerStyle = (feature: Feature<LineString>) => {
  return new Style(feature.get('measure') ? MeasureStyle : GeometryStyle);
};
