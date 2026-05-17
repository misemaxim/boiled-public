import React from 'react';
import { Mapping } from './elements/modules/mapping/mapping';
import './app.scss';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Plugins } from './elements/modules/plugins/plugins';
import { ConfirmationModal } from './interface/confirmation-modal';
import { Settings } from './elements/modules/settings/settings';
import { Login } from './elements/modules/login/login';
import { InfoModal } from './interface/info-modal';
import { APP_MODULES, ByPass, NullObject } from '../types';
import { getAppConfig, initAppConfig } from './lib/get-app-config';
import { HomeRouter } from './home-router';
import { urlService } from './lib/url-service';

interface AppState {
  loaded: boolean;
}
export class App extends React.PureComponent<NullObject, AppState> {
  public constructor(props: NullObject) {
    super(props);

    this.state = {
      loaded: false
    };
  }

  public async componentDidMount(): Promise<void> {
    await initAppConfig();
    this.setState({ loaded: true });

    if (![APP_MODULES.PUBLIC, APP_MODULES.LOGIN].includes(location.pathname as ByPass)) {
      if (!getAppConfig().username) {
        urlService.change(APP_MODULES.LOGIN, true);
      }
    }
  }

  public render(): JSX.Element {
    return this.state.loaded ? (
      <div>
        <BrowserRouter>
          <Routes>
            <Route
              path={'/'}
              element={<HomeRouter />}
            />
            {getAppConfig().username ? (
              <React.Fragment>
                <Route
                  path={'/' + APP_MODULES.MAP}
                  element={<Mapping />}
                />
                <Route
                  path={'/' + APP_MODULES.PLUGINS}
                  element={<Plugins />}
                />
                <Route
                  path={'/' + APP_MODULES.SETTINGS}
                  element={<Settings />}
                />
              </React.Fragment>
            ) : (
              <React.Fragment>
                <Route
                  path={'/' + APP_MODULES.PUBLIC}
                  element={<Mapping public />}
                />
                <Route
                  path={'/' + APP_MODULES.LOGIN}
                  element={<Login />}
                />
              </React.Fragment>
            )}
          </Routes>
        </BrowserRouter>
        <ConfirmationModal />
        <InfoModal />
      </div>
    ) : <div></div>;
  }
}
