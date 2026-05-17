import React, { useState } from 'react';
import { API_ROUTES } from '../../types';
import { customAxios } from '../lib/custom-axios';
import { dictionary } from '../lib/dictionary';
import { InputModal } from './input-modal';

export const PasswordModal = (props: {
  isOpen: boolean,
  onCloseStart: () => void
}) => {
  const [passwordRequest, setPasswordRequest] = useState<[string, string, string]>(['', '', '']);
  const onChange = (id: string, value: unknown) => {
    const request = passwordRequest.slice() as [string, string, string];
    request[Number(id)] = value as string;
    setPasswordRequest(request);
  };
  const submit = async () => {
    await customAxios.post(API_ROUTES.USER_PASSWORD_CHANGE, passwordRequest);
    location.reload();
  };

  return (
    <InputModal
      isOpen={props.isOpen}
      onCloseStart={props.onCloseStart}
      inputs={[
        {
          id: '0',
          title: dictionary.user.changePasswordCurrentPasswordTitle,
          value: passwordRequest[0],
          secret: true
        },
        {
          id: '1',
          title: dictionary.user.changePasswordNewPasswordTitle,
          value: passwordRequest[1],
          secret: true
        },
        {
          id: '2',
          title: dictionary.user.changePasswordRepeatNewPasswordTitle,
          value: passwordRequest[2],
          secret: true
        }
      ]}
      onChange={onChange}
      submitText={dictionary.user.changePasswordButton}
      onSubmit={submit}
    />
  );
};
