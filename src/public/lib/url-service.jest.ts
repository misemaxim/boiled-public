import 'materialize-css/dist/js/materialize.min.js';
import { jestMockCall } from '../../../tests/jest-mock-call';
import { urlService } from './url-service';

describe('urlService', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: new URL('https://abc.def'),
      configurable: true,
      enumerable: true
    });

    window.dispatchEvent = jest.fn();
    window.history.pushState = jest.fn();
    window.open = jest.fn();
  });

  describe('.change', () => {
    test('should change url without reload for a relative link', () => {
      urlService.change('/link');

      expect(window.dispatchEvent).toBeCalledTimes(1);
      const event = jestMockCall(window.dispatchEvent)[0][0];
      expect(event.type).toBe('popstate');

      expect(window.history.pushState).toBeCalledTimes(1);
      expect(window.history.pushState).toHaveBeenCalledWith(null, '/link', '/link');

      expect(window.open).toBeCalledTimes(0);
    });

    test('should change url without reload on same origin', () => {
      urlService.change('https://abc.def/link');

      expect(window.dispatchEvent).toBeCalledTimes(1);
      const event = jestMockCall(window.dispatchEvent)[0][0];
      expect(event.type).toBe('popstate');

      expect(window.history.pushState).toBeCalledTimes(1);
      expect(window.history.pushState).toHaveBeenCalledWith(null, 'https://abc.def/link', 'https://abc.def/link');

      expect(window.open).toBeCalledTimes(0);
    });

    test('should open external link in a new window', () => {
      urlService.change('https://def.def/link');

      expect(window.dispatchEvent).toBeCalledTimes(0);

      expect(window.history.pushState).toBeCalledTimes(0);

      expect(window.open).toBeCalledTimes(1);
      expect(window.open).toHaveBeenCalledWith('https://def.def/link');
    });
  });

  describe('.set', () => {
    test('should only set url without further changes', () => {
      urlService.set('/link');

      expect(window.dispatchEvent).toBeCalledTimes(0);

      expect(window.history.pushState).toBeCalledTimes(1);
      expect(window.history.pushState).toHaveBeenCalledWith(null, '/link', '/link');

      expect(window.open).toBeCalledTimes(0);
    });
  });

  describe('.isExternal', () => {
    test('should return false for a relative link', () => {
      expect(urlService.isExternal('/link')).toBe(false);
    });

    test('should return false for a link on same origin', () => {
      expect(urlService.isExternal('https://abc.def/link')).toBe(false);
    });

    test('should return true for an external link', () => {
      expect(urlService.isExternal('https://def.def/link')).toBe(true);
    });
  });

  describe('.handler', () => {
    let event: React.MouseEvent<HTMLAnchorElement>;

    beforeEach(() => {
      event = {} as React.MouseEvent<HTMLAnchorElement>;
      event.preventDefault = jest.fn();
      event.stopPropagation = jest.fn();
      event.currentTarget = {
        href: '/link',
        closest: jest.fn() as React.MouseEvent<HTMLAnchorElement>['currentTarget']['closest']
      } as React.MouseEvent<HTMLAnchorElement>['currentTarget'];
    });

    test('should prevent default', () => {
      urlService.handler(event);

      expect(event.preventDefault).toBeCalledTimes(1);
    });

    test('should stop propagation', () => {
      urlService.handler(event);

      expect(event.stopPropagation).toBeCalledTimes(1);
    });

    test('should open link with .change', () => {
      const spy = jest.spyOn(urlService, 'change');

      urlService.handler(event);

      expect(spy).toBeCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('/link');
    });

    test('should close a parent panel if any and non-external link', () => {
      const element = document.createElement('div');
      const panel = M.Sidenav.init(element);
      panel.close = jest.fn();
      M.Sidenav.getInstance = () => panel;
      event.currentTarget.closest = jest.fn((selector => selector === '.sidenav' ? element : undefined));

      urlService.handler(event);

      expect(panel.close).toBeCalledTimes(1);
    });

    test('should close a parent modal if any and non-external link', () => {
      const element = document.createElement('div');
      const modal = M.Modal.init(element);
      modal.close = jest.fn();
      M.Modal.getInstance = () => modal;
      event.currentTarget.closest = jest.fn((selector => selector === '.modal' ? element : undefined));

      urlService.handler(event);

      expect(modal.close).toBeCalledTimes(1);
    });
  });
});