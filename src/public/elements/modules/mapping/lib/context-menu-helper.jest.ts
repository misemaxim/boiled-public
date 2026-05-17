import { contextMapMenuHelper } from './context-menu-helper';
import { eventsScope } from './map-events';

describe('contextMapMenuHelper', () => {
  Object.defineProperty(document.body, 'clientWidth', {
    configurable: true,
    value: 1024
  });
  Object.defineProperty(document.body, 'clientHeight', {
    configurable: true,
    value: 768
  });

  let contextMenu: HTMLDivElement;
  let contextMenuMark: HTMLDivElement;
  let contextMenuCoordinates: HTMLDivElement;

  beforeEach(() => {
    document.querySelector = (selector: string) => {
      if (selector === 'div.boiled-context-menu-actions') {
        contextMenu = document.createElement('div');
        contextMenu.getBoundingClientRect = () => ({
          width: 200,
          height: 100
        } as DOMRect);

        return contextMenu;
      }

      if (selector === 'div.boiled-context-menu-mark') {
        contextMenuMark = document.createElement('div');

        return contextMenuMark;
      }

      if (selector === 'div.boiled-context-menu-coordinates') {
        contextMenuCoordinates = document.createElement('div');

        return contextMenuCoordinates;
      }
    };
  });

  describe('.open', () => {
    test('should set visibility', () => {
      contextMapMenuHelper.open(100, 200);

      expect(contextMenu.style.display).toBe('flex');
      expect(contextMenuMark.style.display).toBe('block');
    });

    test('should set mark position', () => {
      contextMapMenuHelper.open(100, 200);

      expect(contextMenuMark.style.left).toBe('100px');
      expect(contextMenuMark.style.top).toBe('200px');
    });

    test('should set visibility', () => {
      contextMapMenuHelper.open(100, 200);

      expect(contextMenu.style.display).toBe('flex');
      expect(contextMenuMark.style.display).toBe('block');
    });

    test('should display cursor coordinates', () => {
      eventsScope.savedCoordinates = [-183.1216454, 36.8976454];
      contextMapMenuHelper.open(100, 200);

      expect(contextMenuCoordinates.innerHTML).toBe('-183.121645, 36.897645');
    });

    describe('position is below cursor', () => {
      test('should open on right', () => {
        contextMapMenuHelper.open(100, 200);

        expect(contextMenu.style.left).toBe('100px');
        expect(contextMenu.style.top).toBe('200px');
      });

      test('should open on left', () => {
        contextMapMenuHelper.open(1000, 200);

        expect(contextMenu.style.left).toBe('800px');
        expect(contextMenu.style.top).toBe('200px');
      });
    });

    describe('position is above cursor', () => {
      test('should open on right', () => {
        contextMapMenuHelper.open(100, 700);

        expect(contextMenu.style.left).toBe('100px');
        expect(contextMenu.style.top).toBe('600px');
      });

      test('should open on left', () => {
        contextMapMenuHelper.open(1000, 700);

        expect(contextMenu.style.left).toBe('800px');
        expect(contextMenu.style.top).toBe('600px');
      });
    });
  });

  describe('.close', () => {
    test('should remove visibility', () => {
      contextMapMenuHelper.open(100, 200);
      contextMapMenuHelper.close();

      expect(contextMenu.style.display).toBe('none');
      expect(contextMenuMark.style.display).toBe('none');
    });
  });
});
