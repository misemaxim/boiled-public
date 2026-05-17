import React, { useEffect, useState } from 'react';
import './login.scss';
import { InputModal } from '../../../interface/input-modal';
import { noop } from 'lodash';
import { customAxios } from '../../../lib/custom-axios';
import { sessionManager } from '../../../lib/session-manager';
import { API_ROUTES, APP_MODULES } from '../../../../types';
import { getAppConfig } from '../../../lib/get-app-config';
import { urlService } from '../../../lib/url-service';

export const Login = (): JSX.Element => {
  const [details, setDetails] = useState<{ username: string; password: string }>({ username: '', password: '' });

  useEffect(() => {
    if (getAppConfig().username) {
      urlService.change('/', true);
    } else {
      sessionManager.reset();
    }
  }, []);

  const submit = async () => {
    await customAxios.post(API_ROUTES.LOGIN, details);
    urlService.change(APP_MODULES.MAP, true);
  };

  return (
    <div className="boiled-app-module-content login">
      <InputModal
        isOpen={true}
        onCloseStart={noop}
        inputs={[
          {
            id: 'username',
            title: 'Username',
            value: details.username
          },
          {
            id: 'password',
            title: 'Password',
            value: details.password,
            secret: true
          }
        ]}
        onChange={(id, value) => {
          const updatedDetails = { ...details };
          updatedDetails[id as 'username' | 'password'] = value as string;
          setDetails(updatedDetails);
        }}
        submitText="Log In"
        onSubmit={submit}
        nonDismissible
      />
    </div>
  );
};
