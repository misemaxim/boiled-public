import { Map } from 'ol';
import { fromLonLat } from 'ol/proj';

export const createMapMethods = (map: Map) => {
  const view = map.getView();

  const goToCoordinates = ([lon, lat]: [number, number], zoom = 10) => view.animate(
    {
      center: fromLonLat([Number(lon), Number(lat)]),
      duration: 300,
      zoom: view.getZoom() as number > zoom ? view.getZoom() : zoom
    }
  );

  return {
    goToCoordinates,
    goToCurrentCoordinates: () => {
      navigator.geolocation.getCurrentPosition(position => {
        view.animate({
          center: fromLonLat([position.coords.longitude, position.coords.latitude]),
          duration: 1000,
          zoom: 10
        });
      });
    },
    zoomIn: () => view.setZoom((view.getZoom() || 0) + 1),
    zoomOut: () => view.setZoom((view.getZoom() || 0) - 1)
  };
};
