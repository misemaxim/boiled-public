import React from 'react';
import { API_ROUTES } from '../../types';
import './service-icon.scss';

export const iconUrl = (
  icon: string, color: string
) => (API_ROUTES.ICONS + '?icon=' + icon + '&color=' + color.replace('#', '%23'));

export const ServiceIcon = (props: {
  name: string;
  size?: number;
  onClick?: (event: React.MouseEvent<HTMLImageElement>) => void;
  color?: string;
  highlighted?: boolean;
}): JSX.Element => {
  const style = props.highlighted ? { background: props.color || '#000000', borderRadius: 4 } : {};

  return (
    <img
      className="interface-service-icon"
      data-name={props.name}
      data-highlighted={Number(!!props.highlighted)}
      onClick={props.onClick} src={iconUrl(props.name, (props.highlighted ? '#ffffff' : props.color) || '#000000')}
      style={style}
    />
  );
};
