import { sessionManager } from '../../../../lib/session-manager';
import { mapContext } from './map-service';

export const snapshot = () => {
  const attributions = mapContext.map.getAllLayers().map(layer => {
    const layerHtmlStrings = layer.getAttributions();
    if (layerHtmlStrings.length) {
      const element = document.createElement('div');
      element.innerHTML = layerHtmlStrings.join(', ');
      return element.innerText;
    }
  }).filter(attr => attr).join(', ');
  const disclaimer = [
    sessionManager.get().name || 'Untitled Session',
    attributions,
    'Powered by Boiled'
  ];

  const LINE_HEIGHT = 24;
  const PADDING = 8;
  const LINE_SPACE = disclaimer.length * LINE_HEIGHT + PADDING * 2;

  const target = mapContext.map.getTargetElement();
  const mapCanvas = target.querySelector('.ol-layer canvas') as HTMLCanvasElement;
  const width = target.clientWidth;
  const height = target.clientHeight;

  const mapReplicaCanvas = document.createElement('canvas');
  mapReplicaCanvas.width = width;
  mapReplicaCanvas.height = height;

  const replicaContext = mapReplicaCanvas.getContext('2d')!;
  replicaContext.drawImage(mapCanvas, 0, 0);

  const img = new Image();
  img.src = mapReplicaCanvas.toDataURL('image/png');
  img.onload = () => {
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = img.width;
    finalCanvas.height = img.height + LINE_SPACE;

    const finalContext = finalCanvas.getContext('2d')!;
    finalContext.fillStyle = 'white';
    finalContext.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    finalContext.drawImage(img, 0, 0);
    finalContext.textAlign = 'left';
    finalContext.textBaseline = 'top';
    finalContext.font = '18px sans-serif';
    finalContext.fillStyle = 'black';

    disclaimer.forEach((text, index) => {
      finalContext.fillText(
        text,
        PADDING,
        img.height + PADDING + index * LINE_HEIGHT
      );
    });

    const a = document.createElement('a');
    a.href = finalCanvas.toDataURL('image/png');
    a.download = disclaimer[0];
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
};
