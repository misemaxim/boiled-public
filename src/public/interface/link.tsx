import React from 'react';
import { urlService } from '../lib/url-service';

export const Link = (props: {
  href?: string;
  dataTest?: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  trigger: string | JSX.Element;
  className?: string;
  dataSet?: Record<string, unknown>;
  title?: string;
}) => {
  const defeaultStyle = { cursor: 'pointer' };
  const onClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (props.href) {
      urlService.handler(event);
    }

    if (props.onClick) {
      props.onClick(event);
    }
  };

  return (
    <a
      href={props.href}
      data-test={props.dataTest}
      onClick={onClick}
      className={props.className}
      rel="noreferrer"
      target={props.href && urlService.isExternal(props.href) ? '_blank' : undefined}
      title={props.title}
      style={defeaultStyle}
      {...(props.dataSet || {})}
    >
      {props.trigger}
    </a>
  );
};
