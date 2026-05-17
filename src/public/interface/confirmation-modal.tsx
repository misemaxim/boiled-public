import React from 'react';
import { NullObject } from '../../types';
import { overlayManager } from '../lib/overlay-manager';
import { BaseModal } from './base-modal';

interface ConfirmationModalState {
  isOpen: boolean;
  message: JSX.Element | string;
  confirmButtonText?: string;
  onConfirm?: () => void;
}
export class ConfirmationModal extends React.PureComponent<NullObject, ConfirmationModalState> {
  public constructor(props: NullObject) {
    super(props);

    this.state = {
      isOpen: false,
      message: '',
      confirmButtonText: '',
      onConfirm: undefined
    };

    overlayManager.register('confirm', {
      open: options => this.setState({ isOpen: true, ...options }),
      close: () => this.setState({ isOpen: false })
    });
  }

  public close = () => {
    this.setState({
      isOpen: false,
      message: '',
      confirmButtonText: '',
      onConfirm: undefined
    });
  };

  public render(): JSX.Element {
    return (
      <BaseModal
        className="interface-confirmation"
        isOpen={this.state.isOpen}
        content={(
          <div className="interface-confirmation-content">
            {this.state.message}
          </div>
        )}
        onCloseStart={this.close}
        onSubmit={this.state.onConfirm ? () => {
          this.state.onConfirm!();
          this.close();
        } : undefined}
        submitText={this.state.confirmButtonText}
      />
    );
  }
}