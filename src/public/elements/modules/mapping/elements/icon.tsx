import React from 'react';
import { API_ROUTES } from '../../../../../types';

export const iconUrl = (
  icon: string, color: string
) => (API_ROUTES.ICONS + '?icon=' + icon + '&color=' + color.replace('#', '%23'));

interface IconProps {
  name: string;
  size?: number;
  onClick?: (icon: string) => void;
  color?: string;
  highlighted?: boolean;
}
export const Icon = (props: IconProps) => {
  const style = props.highlighted ? { background: props.color || '#000000', borderRadius: 4 } : {};

  return (
    <img
      data-name={props.name}
      data-highlighted={Number(!!props.highlighted)}
      onClick={event => props.onClick && props.onClick(event.currentTarget.dataset.name as string)}
      src={iconUrl(props.name, (props.highlighted ? '#ffffff' : props.color) || '#000000')}
      style={style}
    />
  );
};
