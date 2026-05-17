import { PluginTypes } from '../../../../../types';

const context = `
const { coordinates, session, context, axios, notification, overlay } = scope;

// ...

overlay({
  message: 'Script is executed',
  confirmText: 'Continue',
  confirmAction: () => undefined
});

`;
const search = `
const { query, axios, notification, overlay } = scope;

// ...

overlay({
  message: 'Script is executed',
  confirmText: 'Continue',
  confirmAction: () => undefined
});
`;
const point = `
const { point, group, session, context, axios, notification, overlay } = scope;

// ...

notification('Script is executed');
`;
const auto = `
const { session, context, axios, notification, overlay } = scope;

// ...

notification('Script is executed');
`;

export const defaultScriptBodies = {
  [PluginTypes.Coordinates]: context,
  [PluginTypes.Search]: search,
  [PluginTypes.Point]: point,
  [PluginTypes.Refresh]: auto
};
