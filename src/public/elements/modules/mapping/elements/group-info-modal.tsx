import React from 'react';
import { ServiceIcon } from '../../../../interface/service-icon';
import './point-info-modal.scss';
import { overlayManager } from '../../../../lib/overlay-manager';
import { noop } from 'lodash';
import { dictionary } from '../../../../lib/dictionary';
import { MapGroup } from '../../../../../types';

overlayManager.register('groupInfo', {
  open: (point: MapGroup) => {
    overlayManager.open('confirm', {
      message: <GroupInfo data={point} />
    });
  },
  close: noop
});
const GroupInfo = (props: { data: MapGroup }) => {
  return (
    <div className="boiled-point-info">
      <div>
        <ServiceIcon name={props.data.icon} color={props.data.color} /> <b>{props.data.name}</b>
      </div>
      <br />
      {props.data.properties.map((property, index) => (
        <div key={property}>
          <b>{dictionary.labels.titleDefaultProperty} {index + 1}:</b>
          {property}
        </div>
      ))}
    </div>
  );
};