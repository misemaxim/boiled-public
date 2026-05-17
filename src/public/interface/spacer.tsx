import React from 'react';
import './spacer.scss';

export const Spacer = (props: { size: 's' | 'm' | 'l' }) => {
  return <div className={`interface-spacer ${props.size}`}></div>;
};