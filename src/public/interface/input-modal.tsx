import React from 'react';
import { BaseModal } from './base-modal';
import { Input, InputFormProps } from './input';
import { Spacer } from './spacer';

export const InputModal = (props: {
  isOpen: boolean;
  inputs: InputFormProps['input'][];
  onCloseStart: () => void;
  onChange: (id: string, value: unknown) => void;
  onSubmit: () => void;
  submitText?: string;
  disabledSubmit?: boolean;
  nonDismissible?: boolean;
}) => {
  return <BaseModal
    isOpen={props.isOpen}
    onCloseStart={props.onCloseStart}
    onSubmit={props.onSubmit}
    submitText={props.submitText}
    disabledSubmit={props.disabledSubmit}
    nonDismissible={props.nonDismissible}
    content={(
      <div
        onKeyDown={event => {
          if (event.key === 'Enter' && !props.disabledSubmit) {
            props.onSubmit();
          }
        }}
      >
        {props.isOpen && props.inputs.map((input, index) => (
          <React.Fragment key={input.id}>
            <Input
              input={input}
              onChange={value => {
                props.onChange(input.id, value);
              }}
            />
            {props.inputs.length - 1 !== index && <Spacer size="s" />}
          </React.Fragment>
        ))}
      </div>
    )}
  />;
};
