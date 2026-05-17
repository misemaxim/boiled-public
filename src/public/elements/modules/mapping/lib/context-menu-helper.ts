import { eventsScope } from './map-events';

export const contextMapMenuHelper = {
  open: (x: number, y: number) => {
    const MARGIN = 20;

    const contextMenu = document.querySelector('div.boiled-context-menu-actions') as HTMLDivElement;
    contextMenu.style.display = 'flex';

    const contextMenuPosition = contextMenu.getBoundingClientRect();
    const contextMenuWidth = contextMenuPosition.width;
    const contextMenuHeight = contextMenuPosition.height;

    const enoughToOpenBelow = document.body.clientHeight - y - contextMenuHeight - MARGIN > 0;
    const enoughToOpenOnRight = document.body.clientWidth - x - contextMenuWidth - MARGIN > 0;

    if (enoughToOpenBelow) {
      contextMenu.style.top = y + 'px';
      contextMenu.style.left = enoughToOpenOnRight ? x + 'px' : x - contextMenuWidth + 'px';
    } else {
      contextMenu.style.top = y - contextMenuHeight + 'px';
      contextMenu.style.left = enoughToOpenOnRight ? x + 'px' : x - contextMenuWidth + 'px';
    }

    const contextMenuMark = document.querySelector('div.boiled-context-menu-mark') as HTMLDivElement;
    contextMenuMark.style.display = 'block';
    contextMenuMark.style.top = y + 'px';
    contextMenuMark.style.left = x + 'px';

    document.querySelector('div.boiled-context-menu-coordinates').innerHTML =
      eventsScope.savedCoordinates.map(num => num.toFixed(6)).join(', ');
  },
  close: () => {
    const contextMenu = document.querySelector<HTMLDivElement>('div.boiled-context-menu-actions');
    if (contextMenu) {
      contextMenu.style.display = 'none';
    }

    const contextMenuMark = document.querySelector<HTMLDivElement>('div.boiled-context-menu-mark');
    if (contextMenuMark) {
      contextMenuMark.style.display = 'none';
    }
  }
};
