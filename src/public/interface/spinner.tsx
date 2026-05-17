import React from 'react';

interface SpinnerProps {
  title: string;
  className?: string;
  color?: 'black' | 'white';
}
export const Spinner = (props: SpinnerProps) => {
  const colors = {
    black: '#000000',
    white: '#FFFFFF'
  };

  return (
    <div className={props.className ? 'ac-spinner ' + props.className : 'ac-spinner'}>
      <div className="preloader-wrapper big active">
        <div style={{ borderColor: colors[props.color || 'black'] }} className="spinner-layer">
          <div className="circle-clipper left">
            <div className="circle"></div>
          </div><div className="gap-patch">
            <div className="circle"></div>
          </div><div className="circle-clipper right">
            <div className="circle"></div>
          </div>
        </div>
      </div>
      <span style={{ textTransform: 'uppercase', color: colors[props.color || 'black'] }}>{props.title}</span>
    </div>
  );
};
