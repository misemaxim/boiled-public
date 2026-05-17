import axios from 'axios';
import { MapContext, MapGroup, PointData, SessionSchema } from '../../../../../types';
import { overlayManager } from '../../../../lib/overlay-manager';
import { showMessage } from '../../../../interface/show-message';

export interface PossiblePluginScope {
  coordinates?: [number, number],
  point?: PointData,
  group?: MapGroup,
  context?: Pick<MapContext, 'initializing' | 'methods' | 'groups' | 'points' | 'map'>,
  session?: SessionSchema,
  query?: string
}

export const evaluatePluginScript = async (
  script: string,
  scope: PossiblePluginScope
) => {
  const forbiddenVariables = [
    'window',
    'document',
    'localStorage',
    'sessionStorage',
    'self'
  ];

  // eslint-disable-next-line prefer-arrow-callback, @typescript-eslint/no-empty-function
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const functionCall = new AsyncFunction(
    'scope',
    '"use strict";' + forbiddenVariables.map(variable => `const ${variable} = undefined;`).join('') + script
  );

  try {
    await functionCall.call(undefined, {
      ...scope,
      axios,
      notification: showMessage,
      overlay: ({
        message,
        confirmAction,
        confirmText
      }: {
        message: string,
        confirmAction: () => void,
        confirmText: string
      }) => {
        overlayManager.open('confirm', {
          message,
          onConfirm: confirmAction,
          confirmButtonText: confirmText
        });
      }
    });
  } catch (error) {
    showMessage('Error on invoking plugin:' + error);
  }
};
