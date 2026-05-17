import React from 'react';
import './context-menu.scss';
import { eventsScope } from '../lib/map-events';
import { contextMapMenuHelper } from '../lib/context-menu-helper';
import { sessionManager } from '../../../../lib/session-manager';
import { Button } from '../../../../interface/button';
import { MapContext, PluginTypes } from '../../../../../types';
import { Dropdown } from '../../../../interface/dropdown';
import { pluginsManager } from '../../plugins/lib/plugins-manager';
import { overlayManager } from '../../../../lib/overlay-manager';
import { dictionary } from '../../../../lib/dictionary';
import { showMessage } from '../../../../interface/show-message';
import { mapContext } from '../lib/map-service';

interface ContextMenuProps {
  mapContext: MapContext;
}
export const ContextMenu = (props: ContextMenuProps) => {
  const goToCoordinates = () => {
    props.mapContext.methods.goToCoordinates(eventsScope.savedCoordinates, props.mapContext.map.getView().getZoom());
    contextMapMenuHelper.close();
  };

  const openNewPointAdding = () => {
    const session = sessionManager.get();

    if (session.groups.length) {
      overlayManager.open('pointCreate');
    } else {
      showMessage('There are no groups created yet. Please create your first group to start adding new points.');
    }

    contextMapMenuHelper.close();
  };

  const plugins = sessionManager.plugins.get();

  return (
    <div className="boiled-context-menu">
      <div className="boiled-context-menu-mark"></div>
      <div className="boiled-context-menu-actions">
        <div className="boiled-context-menu-coordinates"></div>
        <Button
          onClick={openNewPointAdding}
          icon="map-pin-plus"
          dataTest="context-new-point"
          tooltip={dictionary.actions.mappingContextAddPoint}
        />
        <Button
          onClick={goToCoordinates}
          icon="navigation"
          tooltip={dictionary.actions.mappingContextCenterMap}
        />
        {!!plugins[PluginTypes.Coordinates].length && (
          <Dropdown
            trigger={
              <Button
                icon="plug"
                tooltip={dictionary.actions.mappingContextRunPlugin}
              />
            }
            dataTest="context-plugins"
            options={plugins[PluginTypes.Coordinates].map(plugin => ({
              title: plugin.data.name,
              onClick: async () => {
                await pluginsManager.evaluate(plugin._id);
                mapContext.refresh.run(false);
              }
            }))}
          />
        )}
      </div>
    </div>
  );
};
