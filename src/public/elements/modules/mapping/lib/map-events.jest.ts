import { Map } from 'ol';
import { freeDragging, setMapEvents } from './map-events';
import BaseEvent from 'ol/events/Event';
import { jestMockCall } from '../../../../../../tests/jest-mock-call';
import { DragPan } from 'ol/interaction';

describe('setMapEvents', () => {
  let map: Map;
  let target: HTMLDivElement;

  // eslint-disable-next-line @typescript-eslint/ban-types
  const events: Record<string, EventListener | ((event: BaseEvent) => unknown)> = {};

  beforeEach(() => {
    map = {
      addInteraction: jest.fn() as Map['addInteraction'],
      on: ((type: string, callback: (event: BaseEvent) => unknown) => {
        events['map-' + type] = callback;
      })as Map['on'],
      forEachFeatureAtPixel: jest.fn() as Map['forEachFeatureAtPixel'],
      getTarget: jest.fn().mockReturnValue('map-target') as Map['getTarget']
    } as Map;

    // eslint-disable-next-line @typescript-eslint/ban-types
    document.addEventListener = (type: string, callback: EventListener) => {
      events['document-' + type] = callback;
    };

    document.getElementById = (id: string) => {
      target = document.createElement('div');
      target.id = id;

      target.addEventListener = (type: string, callback: EventListener) => {
        events['target-' + type] = callback;
      };

      return target;
    };

    setMapEvents(map);
  });

  test('should have grab icon on ctrl press', () => {
    expect(target.style.cursor).toBe('');

    (events['document-keydown'] as EventListener)({ ctrlKey: true } as MouseEvent);

    expect(target.style.cursor).toBe('grab');
  });

  test('should clear grab cursor with keyup', () => {
    (events['document-keydown'] as EventListener)({ ctrlKey: true } as MouseEvent);
    (events['document-keyup'] as EventListener)({} as MouseEvent);

    expect(target.style.cursor).toBe('');
  });

  test('should add free dragging map interaction', () => {
    expect(map.addInteraction).toBeCalledTimes(1);

    const interaction = jestMockCall(map.addInteraction)[0][0];

    expect(interaction instanceof DragPan).toBe(true);

    const condition = interaction.condition_;

    expect(condition({ originalEvent: {} })).toBe(undefined);

    freeDragging.start();

    expect(condition({ originalEvent: {} })).toBe(true);

    freeDragging.stop();

    expect(condition({ originalEvent: {} })).toBe(undefined);

    expect(condition({ originalEvent: { ctrlKey: true } })).toBe(true);
  });
});
