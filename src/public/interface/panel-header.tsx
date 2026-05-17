import React from 'react';
import { ServiceIcon } from './service-icon';
import './panel-header.scss';
import { Dropdown } from './dropdown';

export const PanelHeader = (props: {
  actions?: { title: string; onClick?: () => void; danger?: boolean; options?: { title: string; onClick?: () => void; }[] }[];
  onCloseStart?: () => void;
}) => {
  return (
    <div className="interface-panel-header z-depth-3">
      {props.actions && !!props.actions.length && (
        <Dropdown
          trigger={<ServiceIcon name="menu-2" size={32} color="#FFFFFF" />}
          dataTest="boiled-overlay-actions"
          options={props.actions}
        />
      )}
      {props.onCloseStart && (
        <a className="sidenav-close" onClick={props.onCloseStart}>
          <ServiceIcon name="x" size={32} color="#FFFFFF" />
        </a>
      )}
    </div>
  );
};
