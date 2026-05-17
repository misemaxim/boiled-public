import { renderToString } from 'react-dom/server';

export const showMessage = (message: string | JSX.Element, type: 'normal' | 'error' = 'normal') => {
  let html: string;
  if (typeof message === 'string') {
    html = message;
  } else {
    html = renderToString(message);
  }

  M.toast({ html, displayLength: 3000, classes: type === 'error' ? 'danger' : '' });
};
