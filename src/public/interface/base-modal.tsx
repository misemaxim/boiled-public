import React from 'react';
import './base-modal.scss';
import { Button } from './button';
import { PanelHeader } from './panel-header';
import classNames from 'classnames';
import ReactDOM from 'react-dom';
import { dictionary } from '../lib/dictionary';

interface ModalProps {
  title?: string;
  content: JSX.Element;
  isOpen: boolean;
  className?: string;
  onCloseStart: () => void;
  onCancel?: () => void;
  onSubmit?: () => void;
  submitText?: string;
  cancelText?: string;
  nonDismissible?: boolean;
  wide?: true;
  disabledSubmit?: boolean;
  actions?: { title: string; onClick?: () => void; danger?: boolean; options?: { title: string; onClick?: () => void; }[] }[];
}
export class BaseModal extends React.PureComponent<ModalProps> {
  public modalRef = React.createRef<HTMLDivElement>();
  private instance!: M.Modal;

  public constructor(props: ModalProps) {
    super(props);
  }

  public componentDidMount(): void {
    const modalElement = this.modalRef.current as HTMLDivElement;

    this.instance = M.Modal.init(
      modalElement,
      {
        onCloseStart: this.props.onCloseStart,
        dismissible: !this.props.nonDismissible
      }
    );

    if (this.props.isOpen) {
      this.instance.open();
    }
  }

  public componentDidUpdate(prevProps: ModalProps): void {
    if (prevProps.isOpen !== this.props.isOpen) {
      this.instance[this.props.isOpen ? 'open' : 'close']();
    }
  }

  public componentWillUnmount(): void {
    this.instance.destroy();
  }

  public onCancel = () => {
    this.props.onCancel && this.props.onCancel();
    this.props.onCloseStart();
  };

  public onSubmit = () => {
    this.props.onSubmit && this.props.onSubmit();
    this.props.onCloseStart();
  };

  public render(): JSX.Element {
    const modal = (
      <div
        ref={this.modalRef}
        className={classNames(
          'modal',
          'interface-base-modal',
          this.props.className
        )}
        data-wide={Number(!!this.props.wide)}
      >
        {(!this.props.nonDismissible || (this.props.actions && this.props.actions.length)) && (
          <PanelHeader
            onCloseStart={this.props.nonDismissible ? undefined : this.props.onCloseStart}
            actions={this.props.actions}
          />
        )}
        <div className="modal-content">
          {this.props.content}
        </div>
        {(this.props.onSubmit || this.props.onCancel) && (
          <div className="modal-footer" data-wide-button={Number(!this.props.onSubmit || !this.props.onCancel)}>
            {this.props.onCancel && (
              <Button
                text={this.props.cancelText || dictionary.defaultActions.cancel}
                onClick={this.onCancel}
                empty
              />
            )}
            {this.props.onSubmit && (
              <Button
                text={this.props.submitText || dictionary.defaultActions.confirm}
                onClick={this.onSubmit}
                disabled={this.props.disabledSubmit}
              />
            )}
          </div>
        )}
      </div>
    );

    return ReactDOM.createPortal(modal, document.getElementById('app-root')!);
  }
}
