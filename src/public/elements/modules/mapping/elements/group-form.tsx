import React from 'react';
import './create-new-group-form.scss';
import { nanoid } from 'nanoid';
import { SidePanel } from '../../../../interface/side-panel';
import { mapContext } from '../lib/map-service';
import icons from '../../../../../../node_modules/@tabler/icons/tags.json';
import { Icon } from './icon';
import { Input } from '../../../../interface/input';
import { Button } from '../../../../interface/button';
import { overlayManager } from '../../../../lib/overlay-manager';
import { noop } from 'lodash';
import { dictionary } from '../../../../lib/dictionary';
import { schemaValidation } from '../../../../../common/schema-validation';
import { ServiceIcon } from '../../../../interface/service-icon';
import { Spacer } from '../../../../interface/spacer';
import { MapGroup, NullObject } from '../../../../../types';

const iconsMap = Object.keys(icons).map(key => ({ key, tags: icons[key as keyof typeof icons].tags }));

interface GroupFormState {
  isCreate: boolean;
  isOpen: boolean;
  group: MapGroup;
  iconSearch: string;
  isValidInput: boolean;
}
export class GroupForm extends React.PureComponent<NullObject, GroupFormState> {
  private colorInputTimeOut?: NodeJS.Timeout;

  public constructor(props: NullObject) {
    super(props);

    this.state = {
      isCreate: true,
      isOpen: false,
      group: this.newGroup(),
      iconSearch: '',
      isValidInput: false
    };
  }

  public componentDidMount(): void {
    overlayManager.register('groupCreate', {
      open: () => {
        this.setState({
          isCreate: true,
          isOpen: true,
          group: this.newGroup()
        });
      },
      close: noop
    });
    overlayManager.register('groupEdit', {
      open: (group: MapGroup) => {
        this.setState({
          isCreate: false,
          isOpen: true,
          group
        });
      },
      close: noop
    });
  }

  public async componentDidUpdate(): Promise<void> {
    this.setState({ isValidInput: await schemaValidation.group(this.state.group) });
  }

  public newGroup = (): MapGroup => ({
    id: nanoid(16),
    icon: iconsMap[0].key,
    name: '',
    color: '#000000',
    properties: [],
    plugins: [],
    created: Date.now()
  });

  public changeGroupProperty = (groupProperty: string, index: number) => {
    const editableGroupProperties = [...this.state.group.properties];
    editableGroupProperties[index] = groupProperty;

    this.setState({
      group: {
        ...this.state.group,
        properties: editableGroupProperties
      }
    });
  };

  public addGroupProperty = () => {
    const defaultNameStart = dictionary.labels.titleDefaultProperty + ' #';
    const updatedGroupProperties = this.state.group.properties.concat([defaultNameStart + Date.now()]);

    this.setState({
      group: {
        ...this.state.group,
        properties: updatedGroupProperties
      }
    });
  };

  public submitGroup = () => {
    if (this.state.isCreate) {
      mapContext.groups.add(this.state.group);
    } else {
      mapContext.groups.update(this.state.group);
    }

    this.setState({ isOpen: false });
  };

  public render(): JSX.Element {
    const icons = this.state.iconSearch ?
      iconsMap.filter(icon => icon.tags.find((tag: string) => tag.includes(this.state.iconSearch.toLowerCase()))).slice(0, 32) :
      [];

    return (
      <SidePanel
        edge="right"
        maxWidth={600}
        isOpen={this.state.isOpen}
        onCloseStart={() => this.setState({ isOpen: false })}
        onSubmit={this.submitGroup}
        submitDisabled={!this.state.isValidInput}
        dataTest="group-form"
        content={(
          <div className="boiled-context-menu">
            <Input
              input={{
                id: 'name',
                title: dictionary.defaultActions.nameInputLabel,
                value: this.state.group.name
              }}
              onChange={name => {
                this.setState({
                  group: {
                    ...this.state.group,
                    name
                  }
                });
              }}
            />
            <Spacer size="s" />

            <div className="interface-input boiled-group-color-select boiled-space-bottom-medium">
              <div>
                <label>Color</label>
                <input
                  type="color"
                  value={this.state.group.color}
                  onChange={event => {
                    clearTimeout(this.colorInputTimeOut);

                    const color = event.target.value as string;
                    this.colorInputTimeOut = setTimeout(() => {
                      this.setState({
                        group: {
                          ...this.state.group,
                          color
                        }
                      });
                    }, 300);
                  }}
                />
              </div>
            </div>
            <Spacer size="s" />

            <div className="interface-input boiled-group-selected-icon">
              <div>
                <label>Icon</label>
                <ServiceIcon
                  name={this.state.group.icon}
                  color={this.state.group.color}
                />
              </div>
            </div>
            <Spacer size="s" />

            <Input
              input={{
                id: 'icon-search',
                title: dictionary.labels.inputIconSearch,
                value: this.state.iconSearch
              }}
              onChange={iconSearch => this.setState({
                iconSearch
              })}
            />
            <div className="boiled-group-icon-select">
              {icons.map(icon => (
                <Icon
                  onClick={icon => {
                    this.setState({
                      iconSearch: '',
                      group: {
                        ...this.state.group,
                        icon
                      }
                    });
                  }}
                  key={icon.key}
                  name={icon.key}
                />
              ))}
            </div>
            <Spacer size="s" />

            {this.state.group.properties.map((groupProperty, key) => (
              <React.Fragment key={this.state.group.properties.length + '-' + key}>
                <div
                  className="group-property-row"
                >
                  <Input
                    input={{
                      id: 'property',
                      title: dictionary.labels.titleDefaultProperty + ' #' + (key + 1),
                      value: groupProperty
                    }}
                    onChange={name => this.changeGroupProperty(name, key)}
                  />
                  {this.state.isCreate && (
                    <Button
                      icon="x"
                      onClick={() => {
                        const group = { ...this.state.group };
                        group.properties.splice(key, 1);

                        this.setState({ group });
                      }}
                    />
                  )}
                </div>
                <Spacer size="s" />
              </React.Fragment>
            ))}

            <Spacer size="m" />
            <Button
              text={dictionary.actions.editorAddGroupProperty}
              onClick={this.addGroupProperty}
              dataTest="add-group-property"
              wide
            />
          </div>
        )}
      />
    );
  }
}
