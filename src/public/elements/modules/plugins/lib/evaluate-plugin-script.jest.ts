import axios from 'axios';
import { ByPass, MapContext } from '../../../../../types';
import { showMessage } from '../../../../interface/show-message';
import { overlayManager } from '../../../../lib/overlay-manager';
import { evaluatePluginScript } from './evalulate-plugin-script';

jest.mock('../../../../lib/overlay-manager', () => ({
  overlayManager: {
    open: jest.fn(),
    close: jest.fn()
  }
}));
jest.mock('../../../../interface/show-message', () => ({
  showMessage: jest.fn()
}));

describe('evaluatePluginScript', () => {
  let invocationScope: Record<string, ByPass> = {};

  const fakeMapContext = {
    test: jest.fn().mockImplementation(scope => invocationScope = scope)
  } as unknown as MapContext;

  beforeEach(() => {
    invocationScope = {};
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should run script in given scope', async () => {
    const script = 'scope.context.test(scope)';

    await evaluatePluginScript(script, { context: fakeMapContext });

    expect(invocationScope.context).toBe(fakeMapContext);
    expect(invocationScope.axios).toBe(axios);

    expect(showMessage).toBeCalledTimes(0);
    invocationScope.notification('notice');
    expect(showMessage).toBeCalledTimes(1);
    expect(showMessage).toHaveBeenCalledWith('notice');

    expect(overlayManager.open).toBeCalledTimes(0);
    invocationScope.overlay({
      message: 'Script Message',
      confirmAction: 'Process Act',
      confirmText: 'To Do'
    });
    expect(overlayManager.open).toBeCalledTimes(1);
    expect(overlayManager.open).toHaveBeenCalledWith('confirm', {
      message: 'Script Message',
      onConfirm: 'Process Act',
      confirmButtonText: 'To Do'
    });
  });

  test('should limit access to environment', async () => {
    const forbiddenVariables = [
      'window',
      'document',
      'localStorage',
      'sessionStorage',
      'self'
    ];
    const script = `scope.context.test({ ${forbiddenVariables.join(', ')} })`;

    await evaluatePluginScript(script, { context: fakeMapContext });

    forbiddenVariables.forEach(key => {
      expect(invocationScope[key]).toBe(undefined);
    });
  });
});