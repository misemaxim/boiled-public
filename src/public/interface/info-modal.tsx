import React from 'react';
import './base-modal.scss';
import { BaseModal } from './base-modal';
import { overlayManager } from '../lib/overlay-manager';

interface InfoModalState {
  content: JSX.Element | string;
  actions: { title: string; onClick: () => void; danger?: boolean }[];
  isOpen: boolean;
}
export class InfoModal extends React.PureComponent<unknown, InfoModalState> {
  public modalRef = React.createRef<HTMLDivElement>();
  private instance!: M.Modal;

  public constructor(props: unknown) {
    super(props);

    this.state = {
      content: '',
      actions: [],
      isOpen: false
    };

    overlayManager.register('infoModal', {
      open: options => this.setState({ isOpen: true, ...options }),
      close: () => this.setState({ isOpen: false })
    });
  }

  public componentWillUnmount(): void {
    this.instance.destroy();
  }

  public render(): JSX.Element {
    return (
      <BaseModal
        isOpen={this.state.isOpen}
        content={(
          <div>{this.state.content}</div>
        )}
        onCloseStart={() => this.setState({ isOpen: false })}
        actions={this.state.actions}
      />
    );
  }
}
