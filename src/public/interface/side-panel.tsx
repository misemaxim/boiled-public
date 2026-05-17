import React from 'react';
import classNames from 'classnames';
import './side-panel.scss';
import { PanelHeader } from './panel-header';
import { Button } from './button';
import ReactDOM from 'react-dom';
import { dictionary } from '../lib/dictionary';

interface SidebarProps {
  content: JSX.Element;
  isOpen: boolean;
  className?: string;
  onCloseStart: () => void;
  maxWidth?: number;
  submitText?: string;
  submitDanger?: boolean;
  onSubmit?: () => void;
  edge?: 'left' | 'right';
  submitDisabled?: boolean;
  dataTest?: string;
}
export class SidePanel extends React.PureComponent<SidebarProps> {
  private sidebarRef = React.createRef<HTMLDivElement>();
  private instance!: M.Sidenav;
  private styles: Record<string, unknown> = {};

  public constructor(props: SidebarProps) {
    super(props);

    if (props.maxWidth) {
      this.styles = { maxWidth: props.maxWidth };
    }
  }

  public componentDidMount(): void {
    const sidebarElement = this.sidebarRef.current as HTMLDivElement;
    this.instance = M.Sidenav.init(
      sidebarElement,
      { onCloseStart: this.props.onCloseStart, draggable: false, edge: this.props.edge || 'left' }
    );
    if (this.props.isOpen) {
      this.instance.open();
    }
  }

  public componentWillUnmount(): void {
    this.instance.destroy();
  }

  public componentDidUpdate(prevProps: SidebarProps): void {
    if (prevProps.isOpen !== this.props.isOpen) {
      this.instance[this.props.isOpen ? 'open' : 'close']();
    }
  }

  public render(): JSX.Element {
    const sidepanel = (
      <div
        ref={this.sidebarRef}
        className={classNames('sidenav', 'interface-side-panel', this.props.className)}
        style={this.styles}
        data-test={this.props.dataTest}
      >
        <div className="z-depth-2">
          <PanelHeader onCloseStart={this.props.onCloseStart} />
          <div className="interface-side-panel-content-wrapper">
            <div>
              {this.props.isOpen ? this.props.content : null}
            </div>
            <div>
              {this.props.onSubmit && (
                <div className="interface-side-panel-action">
                  <Button
                    text={this.props.submitText || dictionary.defaultActions.confirm}
                    onClick={this.props.onSubmit}
                    disabled={this.props.submitDisabled}
                    danger={this.props.submitDanger}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );

    return ReactDOM.createPortal(sidepanel, document.getElementById('app-root')!);
  }
}