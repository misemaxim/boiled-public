import React from 'react';
import './plugins.scss';
import { Navigation } from '../../../interface/navigation';
import { MapContext, NullObject, PluginSchemaRaw, PluginTypes, SessionSchema, SessionSchemaDev } from '../../../../types';
import { defaultScriptBodies } from './lib/default-script-bodies';
import codeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/theme/ayu-dark.css';
import 'codemirror/addon/display/autorefresh';
import { pluginsManager } from './lib/plugins-manager';
import { InputModal } from '../../../interface/input-modal';
import { evaluatePluginScript } from './lib/evalulate-plugin-script';
import { PluginsTable } from './elements/plugins-table';
import { SidePanel } from '../../../interface/side-panel';
import { SearchPluginInput } from './elements/search-plugin-input';
import { overlayManager } from '../../../lib/overlay-manager';
import { createMapContext } from '../mapping/lib/map-service';
import testSession from '../../../../../dev/data/session.json';
import { dictionary } from '../../../lib/dictionary';

interface PluginsState {
  pluginId: string;
  pluginSchema: PluginSchemaRaw | null;
  initialPluginName: string;
  pluginName: string;
  pluginType: PluginTypes;
  isPluginsSaveShown: boolean;
  isPluginsTableShown: boolean;
}
export class Plugins extends React.PureComponent<NullObject, PluginsState> {
  private editor!: CodeMirror.Editor;
  private testMapContext!: MapContext;
  private testSession = testSession as SessionSchemaDev as SessionSchema;

  public constructor(props: NullObject) {
    super(props);

    this.state = {
      pluginId: '',
      pluginSchema: null,
      initialPluginName: '',
      pluginName: '',
      pluginType: PluginTypes.Coordinates,
      isPluginsSaveShown: false,
      isPluginsTableShown: false
    };
  }

  public componentDidMount(): void {
    this.editor = codeMirror(document.getElementById('boiled-plugins-editor')!, {
      lineWrapping: true,
      value: defaultScriptBodies[this.state.pluginType].trim(),
      mode: 'javascript',
      theme: 'ayu-dark',
      lineNumbers: true,
      autoRefresh: true
    });

    this.testMapContext = createMapContext('boiled-plugins-test-map-initializer');
  }

  public changePluginType(pluginType: PluginTypes): void {
    if (this.editor.getValue().trim() !== defaultScriptBodies[this.state.pluginType].trim()) {
      overlayManager.open('confirm', {
        message: dictionary.confirmations.pluginTypeChange,
        onConfirm: () => {
          this.setState({ pluginType });
        },
        confirmButtonText: dictionary.defaultActions.continue
      });
    } else {
      this.setState({ pluginType });
    }
  }

  public render(): JSX.Element {
    return (
      <div className="boiled-app-module-content plugins">
        <Navigation
          actions={[
            [
              {
                icon: 'circle-plus',
                name: dictionary.defaultActions.startNew,
                onClick: () => {
                  this.editor.setValue(defaultScriptBodies[PluginTypes.Coordinates]);
                  this.setState({
                    pluginId: '',
                    initialPluginName: '',
                    pluginName: '',
                    pluginType: PluginTypes.Coordinates
                  });
                }
              },
              {
                icon: 'device-floppy',
                name: dictionary.defaultActions.save,
                onClick: this.state.pluginId ? undefined : () => this.setState({ isPluginsSaveShown: true }),
                options: this.state.pluginId ? [
                  {
                    title: dictionary.defaultActions.save,
                    onClick: async () => {
                      await pluginsManager.save({
                        type: this.state.pluginType,
                        name: this.state.initialPluginName,
                        script: this.editor.getValue().trim()
                      }, this.state.pluginId);
                    }
                  },
                  {
                    title: dictionary.defaultActions.saveAsNew,
                    onClick: () => this.setState({ isPluginsSaveShown: true })
                  }
                ] : undefined
              },
              {
                icon: 'files',
                name: dictionary.actions.pluginsManager,
                onClick: () => this.setState({ isPluginsTableShown: true })
              }
            ]
          ]}
          secondaryActions={[
            [
              {
                title: true,
                name: this.state.pluginType,
                options: [
                  {
                    title: dictionary.labels.titlePluginTypeCoordinates,
                    onClick: () => this.changePluginType(PluginTypes.Coordinates)
                  },
                  {
                    title: dictionary.labels.titlePluginTypePoint,
                    onClick: () => this.changePluginType(PluginTypes.Point)
                  },
                  {
                    title: dictionary.labels.titlePluginTypeSearch,
                    onClick: () => this.changePluginType(PluginTypes.Search)
                  },
                  {
                    title: dictionary.labels.titlePluginTypeRefresh,
                    onClick: () => this.changePluginType(PluginTypes.Refresh)
                  }
                ]
              }
            ],
            [
              {
                icon: 'player-play',
                name: dictionary.actions.pluginsEvaluate,
                onClick: async () => {
                  if (this.state.pluginType === PluginTypes.Search) {
                    const query = (await overlayManager.open('pluginSearch')) as string;
                    if (!query) {
                      return;
                    }

                    evaluatePluginScript(this.editor.getValue(), { query });
                  } else {
                    evaluatePluginScript(this.editor.getValue(), {
                      coordinates: this.state.pluginType === PluginTypes.Coordinates ?
                        [-118.373941, 34.091660] : undefined,
                      group: this.state.pluginType === PluginTypes.Point ?
                        this.testSession.groups[0] : undefined,
                      point: this.state.pluginType === PluginTypes.Point ?
                        this.testSession.points[this.testSession.groups[0].id][0] : undefined,
                      session: this.testSession,
                      context: this.testMapContext
                    });
                  }
                }
              }
            ]
          ]}
        />

        <InputModal
          isOpen={this.state.isPluginsSaveShown}
          onCloseStart={() => {
            this.setState({
              pluginName: this.state.initialPluginName,
              isPluginsSaveShown: false
            });
          }}
          inputs={[
            {
              id: 'name',
              title: dictionary.defaultActions.nameInputLabel,
              value: this.state.pluginName
            }
          ]}
          onChange={(id, value) => {
            if (id === 'name') {
              this.setState({ pluginName: value as string });
            }
          }}
          submitText={dictionary.defaultActions.save}
          disabledSubmit={!this.state.pluginName.trim()}
          onSubmit={async () => {
            await pluginsManager.save({
              type: this.state.pluginType,
              name: this.state.pluginName,
              script: this.editor.getValue().trim()
            });
            this.setState({ initialPluginName: this.state.pluginName });
          }}
        />

        <SearchPluginInput />

        <SidePanel
          isOpen={this.state.isPluginsTableShown}
          dataTest="plugins-table"
          edge="left"
          maxWidth={600}
          content={(
            <PluginsTable
              onLoad={(id, schema) => {
                this.setState({
                  pluginId: id,
                  pluginType: schema.type,
                  isPluginsTableShown: false
                });
                this.editor.setValue(schema.script.trim());
              }}
            />
          )}
          onCloseStart={() => this.setState({ isPluginsTableShown: false })}
        />

        <div id="boiled-plugins-editor"></div>
        <div id="boiled-plugins-test-map-initializer"></div>
      </div>
    );
  }
}
