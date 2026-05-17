import React, { useState } from 'react';
import { sessionManager } from '../../../../lib/session-manager';
import { DataRow } from '../../../../interface/data-row';
import { mapContext } from '../lib/map-service';
import { overlayManager } from '../../../../lib/overlay-manager';
import { PluginsSelector } from '../../plugins/elements/plugins-selector';
import { PluginTypes } from '../../../../../types';
import { sortBy } from 'lodash';
import { dictionary } from '../../../../lib/dictionary';
import { isPublicMode } from '../lib/is-public-mode';

export const MapGroupsTable = (props: {
  onClick: (id: string) => void
}) => {
  const publicMode = isPublicMode();
  const session = sessionManager.get();
  const [pluginSelectionForGroupId, setPluginSelectionForGroupId] = useState<string>('');

  return (
    <div className="boiled-map-groups-table">
      {sortBy(session.groups, 'name').map(group => (
        <DataRow
          key={group.id}
          name={`${group.name} (${(session.points[group.id] || []).length})`}
          icon={group.icon}
          iconColor={group.color}
          onClick={async () => {
            props.onClick(group.id);
          }}
          actions={publicMode ? [] : [
            {
              icon: 'info-circle',
              tooltip: dictionary.defaultActions.information,
              onClick: () => {
                overlayManager.open('groupInfo', group);
              }
            },
            {
              icon: 'plug',
              tooltip: dictionary.actions.mappingPlugins,
              onClick: () => {
                setPluginSelectionForGroupId(group.id);
              }
            },
            {
              icon: 'edit',
              tooltip: dictionary.defaultActions.edit,
              onClick: () => {
                overlayManager.open('groupEdit', group);
              }
            },
            {
              icon: 'trash',
              tooltip: dictionary.defaultActions.delete,
              onClick: () => {
                overlayManager.open('confirm', {
                  message: dictionary.confirmations.deleteGroup.replace('{name}', group.name),
                  confirmButtonText: dictionary.defaultActions.delete,
                  onConfirm: () => mapContext.groups.delete(group.id)
                });
              }
            }
          ]}
        />
      ))}
      {!publicMode && (
        <PluginsSelector
          isOpen={!!pluginSelectionForGroupId}
          type={PluginTypes.Point}
          onSubmit={selection => {
            sessionManager.plugins.set(PluginTypes.Point, selection, pluginSelectionForGroupId);
          }}
          onCloseStart={() => setPluginSelectionForGroupId('')}
        />
      )}
    </div>
  );
};
