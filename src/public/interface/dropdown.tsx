import React from 'react';
import { nanoid } from 'nanoid';
import './dropdown.scss';
import { Link } from './link';

interface DropdownProps {
  trigger: JSX.Element;
  selectedTitle?: string;
  dataTest?: string;
  options: {
    onClick?: () => void;
    options?: DropdownProps['options'];
    href?: string;
    title: string;
    danger?: boolean;
  }[];
  constrainWidth?: boolean
}
export class Dropdown extends React.PureComponent<DropdownProps> {
  private actionsRef = React.createRef<HTMLAnchorElement>();
  private dropdownRef = React.createRef<HTMLUListElement>();
  private id = nanoid(16);
  private actions!: M.Dropdown;

  public constructor(props: DropdownProps) {
    super(props);
  }

  public componentDidMount(): void {
    this.actions = M.Dropdown.init(this.actionsRef.current!, {
      constrainWidth: !!this.props.constrainWidth,
      closeOnClick: false,
      coverTrigger: false,
      container: document.querySelector('div#app-root')!
    });
  }

  public componentWillUnmount(): void {
    this.actionsRef.current!.parentElement!.appendChild(this.dropdownRef.current!);
  }

  public render(): JSX.Element {
    return (
      <React.Fragment>
        <span
          className="interface-dropdown"
          data-target={`actions-${this.id}`}
          data-test={this.props.dataTest}
          ref={this.actionsRef}
        >
          {this.props.trigger}
        </span>
        <ul id={`actions-${this.id}`} className="dropdown-content" ref={this.dropdownRef}>
          {this.props.options.map(option => (
            <li key={option.title}>
              {option.options ? (
                <Dropdown
                  trigger={
                    <span
                      data-test={option.title.toLocaleLowerCase().split(' ').join('-')}
                      onClick={() => {
                        this.actions.close();
                      }}
                    >
                      {option.title}
                    </span>
                  }
                  options={option.options}
                />
              ) : (
                <Link
                  href={option.href}
                  dataTest={option.title.toLocaleLowerCase().split(' ').join('-')}
                  onClick={() => {
                    option.onClick && option.onClick();
                    this.actions.close();
                  }}
                  trigger={option.title}
                  dataSet={{
                    'data-selected': Number(option.title === this.props.selectedTitle),
                    'data-center': Number(!!this.props.constrainWidth),
                    'data-danger': Number(!!option.danger)
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      </React.Fragment>
    );
  }
}
