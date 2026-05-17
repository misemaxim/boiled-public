import React, { useEffect, useState } from 'react';
import { DataRow } from '../../../../interface/data-row';
import { PluginDefinition, PluginSchemaRaw, ServerStorageItem } from '../../../../../types';
import { pluginsManager } from '../lib/plugins-manager';
import { overlayManager } from '../../../../lib/overlay-manager';
import { dictionary } from '../../../../lib/dictionary';
import { sortBy } from 'lodash';

export const PluginsTable = (props: {
  onLoad: (id: string, schema: PluginSchemaRaw) => void
}) => {
  const [plugins, setPlugins] = useState<ServerStorageItem<PluginDefinition>[]>([]);

  useEffect(() => {
    pluginsManager.definitions()
      .then(plugin => setPlugins(plugin));
  });

  return (
    <div className="boiled-sessions-table">
      {sortBy(plugins, 'data.name').map(plugin => (
        <DataRow
          key={plugin._id}
          name={plugin.data.name}
          onClick={async () => {
            props.onLoad(plugin._id, await pluginsManager.load(plugin._id));
          }}
          actions={[
            {
              icon: 'file-download',
              tooltip: dictionary.defaultActions.export,
              onClick: () => pluginsManager.export(plugin._id)
            },
            {
              icon: 'trash',
              tooltip: dictionary.defaultActions.delete,
              onClick: () => {
                overlayManager.open('confirm', {
                  message: dictionary.confirmations.deletePlugin.replace('{name}', plugin.data.name),
                  confirmButtonText: dictionary.defaultActions.delete,
                  onConfirm: () => pluginsManager.delete(plugin._id)
                });
              }
            }
          ]}
        />
      ))}
    </div>
  );
};
