import React, { useEffect, useRef } from 'react';
import './button.scss';
import { ServiceIcon } from './service-icon';
import { urlService } from '../lib/url-service';

export const Button = (props: {
  text?: string;
  link?: string;
  onClick?: () => void;
  icon?: string;
  rightIcon?: string;
  large?: boolean;
  empty?: boolean;
  wide?: boolean;
  className?: string;
  disabled?: boolean;
  danger?: boolean;
  tooltip?: string;
  tooltipPosition?: 'left' | 'top' | 'right' | 'bottom';
  iconColor?: string;
  dataTest?: string;
}) => {
  const buttonRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (props.tooltip) {
      M.Tooltip.init(buttonRef.current!, { position: props.tooltipPosition });
    }
  }, []);

  const onClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    M.Tooltip.getInstance(buttonRef.current!)?.close();

    if (props.disabled) {
      return;
    }

    if (props.link) {
      urlService.handler(event);
    }

    if (props.onClick) {
      props.onClick();
    }
  };

  return (
    <a
      className={('interface-button waves-effect waves-light z-depth-2 ' + props.className || '').trim()}
      href={props.link}
      onClick={onClick}
      data-large={Number(!!props.large)}
      data-empty={Number(!!props.empty)}
      data-wide={Number(!!props.wide)}
      data-icon={Number(!props.text)}
      data-disabled={Number(!!props.disabled)}
      data-danger={Number(!!props.danger)}
      rel="noreferrer"
      data-tooltip={props.tooltip}
      data-test={props.dataTest}
      ref={buttonRef}
    >
      {props.icon && (
        <ServiceIcon
          name={props.icon}
          color={props.iconColor || '#FFFFFF'}
          size={props.large ? 22 : 18}
        />
      )}
      {props.text}
      {props.rightIcon && (
        <ServiceIcon
          name={props.rightIcon}
          color={props.iconColor || '#FFFFFF'}
          size={props.large ? 22 : 18}
        />
      )}
    </a>
  );
};
