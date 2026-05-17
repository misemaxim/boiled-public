import React from 'react';
import './input.scss';
import { isEqual, kebabCase } from 'lodash';
import moment from 'moment';
import { ServiceIcon } from './service-icon';
import { Link } from './link';
import { nanoid } from 'nanoid';
import { ByPass } from '../../types';
import { showMessage } from './show-message';

export interface MessageFormState {
  value: ByPass;
}
export interface InputFormProps {
  input: {
    id: string;
    title?: string;
    bigText?: boolean;
    optional?: boolean;
    value?: string;
    onEnter?: () => void;
  } | {
    id: string;
    title?: string;
    options: {
      id: string;
      title: string;
    }[];
    optional?: boolean;
    value?: string;
  } | {
    id: string;
    title?: string;
    tags: {
      id: string;
      title: string;
    }[];
    optional?: boolean;
    limit?: number;
    value: string[];
  } | {
    id: string;
    title?: string;
    date: true;
    optional?: boolean;
    value?: number;
  } | {
    id: string;
    title?: string;
    datetime: true;
    optional?: boolean;
    value?: number;
  } | {
    id: string;
    title?: string;
    optional?: boolean;
    value?: string;
    secret: true;
  } | {
    id: string;
    title?: string;
    optional?: boolean;
    value?: string;
    image: true;
    limits?: {
      width: number;
      height: number;
      size: number;
    };
  } | {
    id: string;
    title?: string;
    optional?: boolean;
    value?: boolean;
    checkbox: true;
  },
  onChange?: (value: ByPass) => void;
}
export class Input extends React.PureComponent<InputFormProps, MessageFormState> {
  private dateInput: boolean = false;
  private id = 'input-' + nanoid(16);

  constructor(props: InputFormProps) {
    super(props);

    if ('datetime' in this.props.input || 'date' in this.props.input) {
      this.dateInput = true;
    }

    this.state = {
      value: this.props.input.value || ''
    };
  }

  public componentDidUpdate(prevProps: InputFormProps, prevState: MessageFormState): void {
    if (this.props.onChange && !isEqual(this.state.value, prevState.value)) {
      this.props.onChange(this.state.value);
    }
  }

  public selectOption = (value) => {
    if (!this.props.onChange) {
      return;
    }

    this.setState({ value });
  };

  public changeValue = (prop, value) => {
    if (!this.props.onChange) {
      return;
    }

    if (this.dateInput) {
      this.setState({
        value: new Date(value).valueOf()
      });
    } else {
      this.setState({ value });
    }
  };

  public uploadFile = (prop, files: FileList) => {
    const file = files[0];

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async (): Promise<void> => {
      const value = reader.result as string;
      this.setState({ value });
    };
  };

  public renderWriteStep = (): JSX.Element => {
    const input = this.props.input;

    if ('options' in input) {
      return (
        <div>
          {this.props.input.title && <label>{input.title}</label>}
          {input.options.map(option => (
            <label key={option.id}>
              <input
                name={input.id}
                value={option.id}
                data-test={'input-' + input.id + '-' + kebabCase(option.title)}
                onChange={() => this.selectOption(option.id)}
                type="radio"
                checked={this.state.value === option.id}
                disabled={!this.props.onChange}
              />
              <span>{option.title}</span>
            </label>
          ))}
        </div>
      );
    } else if ('date' in input) {
      return (
        <div>
          {this.props.input.title && <label>{input.title}</label>}
          <input
            value={moment(this.state.value || Date.now()).format('YYYY-MM-DD')}
            onChange={event => this.changeValue(input.id, event.currentTarget.value)}
            type="date"
            data-test={'input-' + input.id}
            onKeyDown={e => {
              e.preventDefault();
            }}
            onClick={e => {
              e.currentTarget.showPicker();
            }}
            disabled={!this.props.onChange}
          />
        </div>
      );
    } else if ('datetime' in input) {
      return (
        <div>
          {this.props.input.title && <label>{input.title}</label>}
          <input
            value={moment(this.state.value || Date.now()).format('YYYY-MM-DDThh:mm')}
            data-test={'input-' + input.id}
            onChange={event => {
              if (!event.currentTarget.validity.valid) {
                return;
              }

              this.changeValue(input.id, event.currentTarget.value);
            }}
            type="datetime-local"
            onKeyDown={e => {
              e.preventDefault();
            }}
            onClick={e => {
              e.currentTarget.showPicker();
            }}
            disabled={!this.props.onChange}
          />
        </div>
      );
    } else if ('secret' in input) {
      return (
        <div>
          {this.props.input.title && <label>{input.title}</label>}
          <input
            value={this.state.value}
            data-test={'input-' + input.id}
            onChange={event => this.changeValue(input.id, event.currentTarget.value)}
            type="password"
            disabled={!this.props.onChange}
          />
        </div>
      );
    } else if ('image' in input) {
      return (
        <div>
          {this.props.input.title && <label>{input.title}</label>}
          <label
            htmlFor={this.id}
            className="interface-button"
          >
            <ServiceIcon
              name="file-media"
              size={18}
            />
            {this.state.value ? 'Update Image' : 'Select Image'}
          </label>
          <input
            id={this.id}
            data-test={'input-' + input.id}
            onChange={event => {
              if (event.target.files) {
                const files = event.target.files;
                const size = event.target.files[0].size / 1024 / 1024;

                if (input.limits) {
                  const limits = input.limits;
                  const img = new Image();
                  const objectUrl = URL.createObjectURL(files[0]);
                  img.onload = event => {
                    const image = event.currentTarget as HTMLImageElement;
                    if (
                      image.width > limits.width ||
                      image.height > limits.height ||
                      size > limits.size
                    ) {
                      showMessage(
                        'Your image is bigger that expected. Please, make sure that:' +
                        `width < ${limits.width}px, height < ${limits.height}px and size < ${limits.size}MB`
                      );
                      this.props.onChange && this.props.onChange('');
                    } else {
                      this.uploadFile(input.id, files);
                    }
                    URL.revokeObjectURL(objectUrl);
                  };
                  img.src = objectUrl;
                } else {
                  this.uploadFile(input.id, files);
                }
              }
            }}
            type="file"
            accept="image/jpeg"
            disabled={!this.props.onChange}
          />
          {this.state.value && <img src={this.state.value} className="interface-input-image-preview" />}
        </div>
      );
    } else if ('checkbox' in input) {
      return (
        <div>
          <label>
            <input
              type="checkbox"
              data-test={'input-' + input.id}
              checked={this.state.value}
              onChange={event => this.changeValue(input.id, event.currentTarget.checked)}
              disabled={!this.props.onChange}
            />
            <span>{input.title}</span>
          </label>
        </div>
      );
    } else if ('tags' in input) {
      return (
        <div>
          {this.props.input.title && <label>{input.title}</label>}
          <div className="interface-input-tags">
            {input.tags.filter(tag => input.value.includes(tag.id)).map(tag => (
              <div key={tag.id} className="chip selected">
                {tag.title}
                <Link
                  trigger={(
                    <ServiceIcon
                      name="x"
                    />
                  )}
                  onClick={() => this.changeValue(input.id, input.value.filter(tagId => tagId !== tag.id))}
                />
              </div>
            ))}
          </div>
          {(!input.limit || input.value.length < input.limit) && (
            <div className="interface-input-tags">
              {input.tags.filter(tag => !input.value.includes(tag.id)).map(tag => (
                <div
                  key={tag.id}
                  className="chip option"
                  onClick={() => this.changeValue(input.id, input.value.concat([tag.id]))}
                >
                  {tag.title}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div>
          {this.props.input.title && <label>{input.title}</label>}
          {
            input.bigText ?
              <textarea
                value={this.state.value}
                onChange={event => this.changeValue(input.id, event.currentTarget.value)}
                disabled={!this.props.onChange}
              /> :
              <input
                value={this.state.value}
                data-test={'input-' + input.id}
                onChange={event => this.changeValue(input.id, event.currentTarget.value)}
                type="text"
                onKeyUp={event => {
                  if (event.key === 'Enter' && input.onEnter) {
                    input.onEnter();
                  }
                }}
                disabled={!this.props.onChange}
              />
          }
        </div>
      );
    }
  };

  public render(): JSX.Element {
    return (
      <div className="interface-input" id={'interface-input-' + this.props.input.id}>
        {this.renderWriteStep()}
      </div>
    );
  }
}
