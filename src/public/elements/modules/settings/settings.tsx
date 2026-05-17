import React from 'react';
import './settings.scss';
import { Navigation } from '../../../interface/navigation';
import { Input } from '../../../interface/input';
import { settingsValues } from '../mapping/lib/variables';
import { localSettings } from '../../../lib/local-settings';
import { dictionary } from '../../../lib/dictionary';
import { NullObject } from '../../../../types';

interface SettingsState {
  measurementUnit: string;
}
export class Settings extends React.PureComponent<NullObject, SettingsState> {
  public constructor(props: NullObject) {
    super(props);

    this.state = {
      measurementUnit: localSettings.get('distanceUnit')
    };
  }

  public componentDidMount(): void {

  }

  public render(): JSX.Element {
    return (
      <div className="boiled-app-module-content settings">
        <Navigation
          actions={[
            [
              {
                icon: 'device-floppy',
                name: 'Save Settings',
                onClick: () => {
                  localSettings.set('distanceUnit', this.state.measurementUnit);
                }
              }
            ]
          ]}
          secondaryActions={[

          ]}
        />

        <div className="boiled-settings">
          <Input
            input={{
              id: 'measurement',
              title: dictionary.settings.measurementSystemTitle,
              value: this.state.measurementUnit,
              options: Object.values(settingsValues.UNIT_OF_LENGTH)
                .map(unit => ({
                  id: unit,
                  title: {
                    [settingsValues.UNIT_OF_LENGTH.KM]: dictionary.settings.systemMetric,
                    [settingsValues.UNIT_OF_LENGTH.MI]: dictionary.settings.systemImperial
                  }[unit]
                }))
            }}
            onChange={measurementUnit => this.setState({ measurementUnit })}
          />
        </div>
      </div>
    );
  }
}
