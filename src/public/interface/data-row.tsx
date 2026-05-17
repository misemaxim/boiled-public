import { kebabCase } from 'lodash';
import React from 'react';
import { Button } from './button';
import './data-row.scss';
import { ServiceIcon } from './service-icon';

export const DataRow = (props: {
  name: string,
  icon?: string,
  iconColor?: string,
  onClick: () => void,
  actions: {
    icon: string,
    tooltip?: string,
    onClick: () => void
  }[]
}) => {
  return (
    <div className="interface-data-row" data-test={'data-row-' + kebabCase(props.name)}>
      <div onClick={props.onClick}>
        {props.icon && (
          <ServiceIcon
            name={props.icon}
            color={props.iconColor}
          />
        )}
        {props.name}
      </div>
      <div>
        {props.actions.map(action => (
          <Button
            key={action.icon}
            icon={action.icon}
            tooltip={action.tooltip}
            onClick={action.onClick}
          />
        ))}
      </div>
    </div>
  );
};
