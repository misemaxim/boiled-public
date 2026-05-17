import React from 'react';
import './create-new-group-form.scss';
import { sessionManager } from '../../../../lib/session-manager';
import { eventsScope } from '../lib/map-events';
import { Input } from '../../../../interface/input';
import { nanoid } from 'nanoid';
import { SidePanel } from '../../../../interface/side-panel';
import { mapContext } from '../lib/map-service';
import { overlayManager } from '../../../../lib/overlay-manager';
import { noop } from 'lodash';
import { schemaValidation } from '../../../../../common/schema-validation';
import { Spacer } from '../../../../interface/spacer';
import { dictionary } from '../../../../lib/dictionary';
import { NullObject, PointData } from '../../../../../types';

interface PointFormState {
  isCreate: boolean;
  isOpen: boolean;
  pointData: PointData;
  isValidInput: boolean;
}
export class PointForm extends React.PureComponent<NullObject, PointFormState> {
  public constructor(props: NullObject) {
    super(props);

    this.state = {
      isCreate: true,
      isOpen: false,
      pointData: this.newPointData(),
      isValidInput: false
    };
  }

  public componentDidMount(): void {
    overlayManager.register('pointCreate', {
      open: () => {
        this.setState({
          isCreate: true,
          isOpen: true,
          pointData: this.newPointData()
        });
      },
      close: noop
    });
    overlayManager.register('pointEdit', {
      open: (pointData: PointData) => {
        this.setState({
          isCreate: false,
          isOpen: true,
          pointData
        });
      },
      close: noop
    });
  }

  public async componentDidUpdate(): Promise<void> {
    this.setState({ isValidInput: await schemaValidation.point(this.state.pointData) });
  }

  public newPointData = (): PointData => ({
    coordinates: eventsScope.savedCoordinates,
    id: nanoid(16),
    name: '',
    group: '',
    properties: [],
    created: Date.now()
  });

  public setPointNameOnPreset = (value: string) => {
    this.setState({
      pointData: {
        ...this.state.pointData,
        name: value
      }
    });
  };

  public setSelectedGroupId = (value: string) => {
    const session = sessionManager.get();
    const prevGroup = this.state.pointData.group;

    const pointDataPreset = { ...this.state.pointData };

    pointDataPreset.group = value;

    if (prevGroup !== value) {
      const selectedGroup = session.groups.find(group => group.id === value)!;
      pointDataPreset.properties = Array(selectedGroup.properties.length).fill('');
    }

    this.setState({ pointData: pointDataPreset });
  };

  public changePointProperties = (value: string, index: number) => {
    const editablePointProperties = [...this.state.pointData.properties];
    editablePointProperties[index] = value;

    this.setState({
      pointData: {
        ...this.state.pointData,
        properties: editablePointProperties
      }
    });
  };

  public submitPoint = async () => {
    if (this.state.isCreate) {
      mapContext.points.add(this.state.pointData);
    } else {
      mapContext.points.update(this.state.pointData);
    }

    this.setState({ isOpen: false });
  };

  public render(): JSX.Element {
    const session = sessionManager.get();

    return (
      <SidePanel
        edge="right"
        maxWidth={600}
        isOpen={this.state.isOpen}
        onCloseStart={() => this.setState({ isOpen: false })}
        onSubmit={this.submitPoint}
        submitDisabled={!this.state.isValidInput}
        dataTest="point-form"
        content={(
          <div>
            <Input
              input={{
                id: 'lon',
                title: dictionary.labels.inputLongitude,
                value: this.state.pointData.coordinates[0].toFixed(6)
              }}
              onChange={this.state.isCreate ? undefined : lon => this.setState({
                pointData: {
                  ...this.state.pointData,
                  coordinates: [Number(lon), this.state.pointData.coordinates[1]]
                }
              })}
            />
            <Spacer size="s" />

            <Input
              input={{
                id: 'lat',
                title: dictionary.labels.inputLatitude,
                value: this.state.pointData.coordinates[1].toFixed(6)
              }}
              onChange={this.state.isCreate ? undefined : lat => this.setState({
                pointData: {
                  ...this.state.pointData,
                  coordinates: [this.state.pointData.coordinates[0], Number(lat)]
                }
              })}
            />
            <Spacer size="s" />

            <Input
              input={{
                id: 'group',
                title: dictionary.labels.inputMapGroup,
                value: this.state.pointData.group,
                options: (
                  this.state.isCreate ?
                    session.groups : session.groups.filter(group => group.id === this.state.pointData.group)!
                ).map(group => ({
                  id: group.id,
                  title: group.name
                }))
              }}
              onChange={id => this.setSelectedGroupId(id)}
            />
            <Spacer size="s" />

            <Input
              input={{
                id: 'name',
                title: dictionary.defaultActions.nameInputLabel,
                value: this.state.pointData.name
              }}
              onChange={name => this.setPointNameOnPreset(name)}
            />
            <Spacer size="s" />

            {
              this.state.pointData.group &&
              session.groups.find(g => g.id === this.state.pointData.group)!.properties.map((property, index) => (
                <React.Fragment key={property}>
                  <Input
                    input={{
                      id: 'property-' + property,
                      title: property,
                      value: this.state.pointData.properties[index]
                    }}
                    onChange={value => this.changePointProperties(value, index)}
                  />
                  <Spacer size="s" />
                </React.Fragment>
              ))
            }
          </div>
        )}
      />
    );
  }
}
