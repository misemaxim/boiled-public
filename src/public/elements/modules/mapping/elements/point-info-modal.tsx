import React from 'react';
import { sessionManager } from '../../../../lib/session-manager';
import { ServiceIcon } from '../../../../interface/service-icon';
import './point-info-modal.scss';
import { overlayManager } from '../../../../lib/overlay-manager';
import { pluginsManager } from '../../plugins/lib/plugins-manager';
import { mapContext } from '../lib/map-service';
import { noop } from 'lodash';
import { PluginTypes, PointData } from '../../../../../types';
import { dictionary } from '../../../../lib/dictionary';
import { isPublicMode } from '../lib/is-public-mode';

overlayManager.register('pointInfo', {
  open: (point: PointData) => {
    const plugins = sessionManager.plugins.get()[PluginTypes.Point][point.group];

    overlayManager.open('infoModal', {
      content: <PointInfo data={point} />,
      actions: isPublicMode() ? undefined : [
        {
          title: dictionary.defaultActions.edit,
          onClick: () => {
            overlayManager.open('pointEdit', point);
          }
        },
        ...(plugins && plugins.length ? [{
          title: dictionary.actions.mappingPlugins,
          options: plugins.map(def => ({
            title: def.data.name,
            onClick: async () => {
              await pluginsManager.evaluate(def._id);
              mapContext.refresh.run(false);
            }
          }))
        }] : []),
        {
          title: dictionary.defaultActions.delete,
          onClick: () => {
            overlayManager.open('confirm', {
              message: dictionary.confirmations.deletePoint.replace('{name}', point.name),
              confirmButtonText: dictionary.defaultActions.delete,
              onConfirm: () => mapContext.points.delete([point.group, point.id])
            });
          }
        }
      ]
    });
  },
  close: noop
});
const PointInfo = (props: { data: PointData }) => {
  const session = sessionManager.get();
  const selectedGroup = session.groups.find(group => group.id === props.data.group)!;

  return (
    <div className="boiled-point-info">
      <div>
        <ServiceIcon name={selectedGroup.icon} color={selectedGroup.color} />
        <b>
          {selectedGroup.name} / {props.data.name}
        </b>
      </div>
      <br />
      {selectedGroup.properties.map((property, index) => (
        <div key={property}>
          <b>{property}:</b> {props.data.properties[index]}
        </div>
      ))}
    </div>
  );
};