import React, { useState } from 'react';
import './navigation.scss';
import { Button } from './button';
import { Dropdown } from './dropdown';
import { urlService } from '../lib/url-service';
import { PasswordModal } from './password-modal';
import { overlayManager } from '../lib/overlay-manager';
import { dictionary } from '../lib/dictionary';
// @ts-ignore
import icon from '../graphics/logo-icon-alpha.png';
// @ts-ignore
import logo from '../graphics/logo-full.png';
import { customAxios } from '../lib/custom-axios';
import { sessionManager } from '../lib/session-manager';
import { localSettings } from '../lib/local-settings';
import { API_ROUTES, APP_MODULES } from '../../types';
import { getAppConfig } from '../lib/get-app-config';

export const Navigation = (props: {
  public?: true;
  actions: {
    icon: string;
    name: string;
    onClick?: () => void;
    active?: boolean;
    title?: boolean;
    options?: {
      onClick?: () => void;
      href?: string;
      active?: boolean;
      title: string;
    }[];
  }[][],
  secondaryActions?: {
    icon?: string;
    name: string;
    onClick?: () => void;
    active?: boolean;
    title?: boolean;
    options?: {
      onClick?: () => void;
      href?: string;
      active?: boolean;
      title: string;
    }[];
  }[][],
}) => {
  const [isChangePasswordShown, setIsChangePasswordShown] = useState<boolean>(false);

  const openUserModal = async () => {
    overlayManager.open('infoModal', {
      content: (
        <div className="boiled-navigation-modal">
          <b>{dictionary.user.usernameLabel}</b>: {getAppConfig().username}<br />
          {/* <b>{dictionary.user.statusLabel}</b>: Superuser<br /> */}
        </div>
      ),
      actions: [
        {
          title: dictionary.user.changePasswordButton,
          onClick: () => {
            setIsChangePasswordShown(true);
          }
        },
        {
          title: dictionary.user.logOutButton,
          onClick: async () => {
            await customAxios.get(API_ROUTES.LOGOUT);

            localSettings.reset();
            await sessionManager.reset();
            location.reload();
          }
        }
      ]
    });
  };

  const openAboutModal = () => {
    const config = getAppConfig().config;
    overlayManager.open('confirm', {
      message: (
        <div className="boiled-navigation-modal">
          {/* <h2>{config.name}</h2> */}
          <img src={logo} className="boiled-about-logo" />
          <b>Version</b>: {config.version}<br />
          <b>Code License</b>: {config.license}<br />
        </div>
      )
    });
  };

  return (
    <React.Fragment>
      <div className="interface-primary-navigation z-depth-1">
        {!props.public && (
          <Dropdown
            dataTest="navigation"
            trigger={
              <a
                className="interface-button waves-effect interface-app-navigation waves-light z-depth-2"
              >
                <img src={icon} />
              </a>
              // <Button
              //   className="interface-app-navigation"
              //   icon="menu-2"
              //   iconColor="#000000"
              // />
            }
            options={[
              { title: dictionary.navigation.mapping, onClick: () => urlService.change(APP_MODULES.MAP) },
              { title: dictionary.navigation.plugins, onClick: () => urlService.change(APP_MODULES.PLUGINS) },
              { title: dictionary.navigation.settings, onClick: () => urlService.change(APP_MODULES.SETTINGS) },
              { title: dictionary.navigation.user, onClick: () => openUserModal() },
              { title: dictionary.navigation.docs, onClick: () => urlService.change('/docs', true) },
              { title: dictionary.navigation.about, onClick: () => openAboutModal() }
            ]}
          />
        )}

        {props.actions.filter(group => group.length).map((group, key) => (
          <div key={key}>
            {group.map(button => (
              button.options ? (
                <Dropdown
                  key={button.name}
                  dataTest={button.name.toLocaleLowerCase().split(' ').join('-')}
                  selectedTitle={button.options.find(option => option.active)?.title}
                  trigger={
                    <Button
                      icon={button.icon}
                      dataTest={button.name.toLocaleLowerCase().split(' ').join('-')}
                      tooltip={button.title ? undefined : button.name}
                      text={button.title ? button.name : undefined}
                      onClick={button.onClick}
                      className={button.active ? 'active' : undefined}
                      iconColor={button.active ? '#000000' : undefined}
                    />
                  }
                  options={button.options}
                />
              ) : (
                <Button
                  key={button.name}
                  dataTest={button.name.toLocaleLowerCase().split(' ').join('-')}
                  icon={button.icon}
                  tooltip={button.title ? undefined : button.name}
                  text={button.title ? button.name : undefined}
                  onClick={button.onClick}
                  className={button.active ? 'active' : undefined}
                  iconColor={button.active ? '#000000' : undefined}
                />
              )
            ))}
          </div>
        ))}
      </div>
      {props.secondaryActions && !!props.secondaryActions.length && (
        <div className="interface-secondary-navigation z-depth-1">
          {props.secondaryActions.filter(group => group.length).map((group, key) => (
            <div key={key}>
              {group.map(button => (
                button.options ? (
                  <Dropdown
                    key={button.name}
                    dataTest={button.name.toLocaleLowerCase().split(' ').join('-')}
                    selectedTitle={button.options.find(option => option.active)?.title}
                    trigger={
                      <Button
                        icon={button.icon}
                        dataTest={button.name.toLocaleLowerCase().split(' ').join('-')}
                        onClick={button.onClick}
                        tooltip={button.title ? undefined : button.name}
                        text={button.title ? button.name : undefined}
                        className={button.active ? 'active' : undefined}
                        iconColor={button.active ? '#000000' : undefined}
                      />
                    }
                    options={button.options}
                  />
                ) : (
                  <Button
                    key={button.name}
                    dataTest={button.name.toLocaleLowerCase().split(' ').join('-')}
                    icon={button.icon}
                    onClick={button.onClick}
                    tooltip={button.title ? undefined : button.name}
                    text={button.title ? button.name : undefined}
                    className={button.active ? 'active' : undefined}
                    iconColor={button.active ? '#000000' : undefined}
                  />
                )
              ))}
            </div>
          ))}
        </div>
      )}


      <PasswordModal
        isOpen={isChangePasswordShown}
        onCloseStart={() => setIsChangePasswordShown(false)}
      />
    </React.Fragment>
  );
};
