import React from 'react';
import './mapping.scss';
import { createMapContext, mapContext } from './lib/map-service';
import { ContextMenu } from './elements/context-menu';
import { sessionManager } from '../../../lib/session-manager';
import { BottomMeasures } from './elements/bottom-measures';
import { LayersManager } from './elements/layers-manager';
import { freeDragging } from './lib/map-events';
import { Navigation } from '../../../interface/navigation';
import { SidePanel } from '../../../interface/side-panel';
import { InputModal } from '../../../interface/input-modal';
import { Button } from '../../../interface/button';
import { SessionsTable } from './elements/sessions-table';
import { MapContext, PluginTypes } from '../../../../types';
import { MapGroupsTable } from './elements/map-groups-table';
import { MapPointsTable } from './elements/map-points-table';
import { PluginsSelector } from '../plugins/elements/plugins-selector';
import { SearchPluginInput } from '../plugins/elements/search-plugin-input';
import { pluginsManager } from '../plugins/lib/plugins-manager';
import { PointForm } from './elements/point-form';
import { GroupForm } from './elements/group-form';
import { overlayManager } from '../../../lib/overlay-manager';
import { dictionary } from '../../../lib/dictionary';
import { isEmpty } from 'ol/extent';
import { showMessage } from '../../../interface/show-message';
import { snapshot } from './lib/snapshot';
import './elements/group-info-modal';
import './elements/point-info-modal';
import { isPublicMode } from './lib/is-public-mode';
import { getAppConfig } from '../../../lib/get-app-config';

enum SAVING_STATUSES {
  SAVED_SESSION = 'saved',
  UNSAVED_CHANGES = 'unsaved-changes',
  UNSAVED_SESSION = 'unsaved-session'
}
interface MappingProps {
  public?: true;
}
interface MappingState {
  mapContext?: MapContext;
  isSessionsTableShown: boolean;
  isMapGroupsShown: boolean;
  mapPointsGroupId: string;
  isMapPointsShown: boolean;
  isLayerManagerShown: boolean;
  isSessionsSaveShown: boolean;
  isGoToCoordinatesShown: boolean;
  activeDrawType: string | null;
  intervalToRefresh: number | null;
  isFreeDraggingActive: boolean;
  isGraticuleActive: boolean;
  coordinatesToGo: [string, string];
  sessionName: string;
  initialSessionName: string;
  pluginSelectionOpenType: PluginTypes.Coordinates | PluginTypes.Search | PluginTypes.Refresh | null;
  activePlugins: ReturnType<typeof sessionManager.plugins.get>;
  status: SAVING_STATUSES;
}
export class Mapping extends React.PureComponent<MappingProps, MappingState> {
  private publicMode = isPublicMode();
  private uploadLocalSessionRef = React.createRef<HTMLInputElement>();
  private statuses = {
    [SAVING_STATUSES.SAVED_SESSION]: {
      icon: 'database',
      message: dictionary.statuses.sessionClean
    },
    [SAVING_STATUSES.UNSAVED_CHANGES]: {
      icon: 'refresh-alert',
      message: dictionary.statuses.sessionChanges
    },
    [SAVING_STATUSES.UNSAVED_SESSION]: {
      icon: 'database-off',
      message: dictionary.statuses.sessionUnsaved
    }
  };

  public constructor(props: MappingProps) {
    super(props);

    this.state = {
      mapContext: undefined,
      isSessionsTableShown: false,
      isMapGroupsShown: false,
      mapPointsGroupId: '',
      isMapPointsShown: false,
      isLayerManagerShown: false,
      isSessionsSaveShown: false,
      isGoToCoordinatesShown: false,
      activeDrawType: null,
      intervalToRefresh: null,
      isFreeDraggingActive: false,
      isGraticuleActive: false,
      coordinatesToGo: ['', ''],
      sessionName: '',
      initialSessionName: '',
      pluginSelectionOpenType: null,
      activePlugins: sessionManager.plugins.get(),
      status: SAVING_STATUSES.UNSAVED_SESSION
    };
  }

  private resetInteractions = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (this.state.activeDrawType) {
        this.toggleDrawing(this.state.activeDrawType as Parameters<typeof this.toggleDrawing>[0]);
      }

      if (this.state.isFreeDraggingActive) {
        this.toggleFreeDragging();
      }
    }
  };
  public async componentDidMount(): Promise<void> {
    if (this.props.public) {
      const config = getAppConfig().config;
      freeDragging.start();

      if (config.public.message) {
        overlayManager.open('confirm', { message: config.public.message });
      }
    }

    const mapContext = createMapContext('boiled-map-container');
    await mapContext.initializing;

    this.setState({ mapContext });

    const extent = mapContext.segments.vector.source.getExtent();
    if (!isEmpty(extent)) {
      mapContext.map.getView().fit(extent, { padding: [32, 32, 32, 32], maxZoom: 18 });
    }

    this.setState({
      initialSessionName: sessionManager.get().name,
      activePlugins: sessionManager.plugins.get()
    });

    document.addEventListener('keyup', this.resetInteractions);

    const checkStatus = () => {
      const status = sessionManager.status();

      if (!status.storage) {
        this.setState({ status: SAVING_STATUSES.UNSAVED_SESSION });
      } else if (status.edited) {
        this.setState({ status: SAVING_STATUSES.UNSAVED_CHANGES });
      } else {
        this.setState({ status: SAVING_STATUSES.SAVED_SESSION });
      }
    };
    checkStatus();
    sessionManager.onIndex(checkStatus);
  }

  private toggleLayer = (layer: string) => {
    this.state.mapContext?.layers.select(layer);
    this.setState({ isLayerManagerShown: false });
  };

  private triggerUploadLocalSession = () => {
    this.uploadLocalSessionRef.current?.click();
  };

  private toggleDrawing = (type: 'LineString' | 'Circle' | 'Polygon' | 'ArrowString' | null): void => {
    this.state.mapContext!.interactions.geometry(type);
    if (this.state.isFreeDraggingActive) {
      this.toggleFreeDragging();
    }

    if (this.state.activeDrawType === type) {
      this.setState({ activeDrawType: null });
    } else {
      this.setState({ activeDrawType: type });
    }
  };

  private toggleMeasurement = (type: 'LineString#measurement' | 'Polygon#measurement'): void => {
    this.state.mapContext!.interactions.measurement(type);
    if (this.state.isFreeDraggingActive) {
      this.toggleFreeDragging();
    }

    if (this.state.activeDrawType === type) {
      this.setState({ activeDrawType: null });
    } else {
      this.setState({ activeDrawType: type });
    }
  };

  private toggleIntervalToRefresh = (value: number | null): void => {
    if (value === this.state.intervalToRefresh || !value) {
      this.setState({ intervalToRefresh: null });
      this.state.mapContext!.refresh.auto(null);
    } else {
      this.setState({ intervalToRefresh: value });
      this.state.mapContext!.refresh.auto(value);
    }
  };

  private toggleFreeDragging = () => {
    if (this.state.activeDrawType) {
      this.toggleDrawing(this.state.activeDrawType as Parameters<typeof this.toggleDrawing>[0]);
    }

    if (this.state.isFreeDraggingActive) {
      freeDragging.stop();
      this.setState({ isFreeDraggingActive: false });
    } else {
      freeDragging.start();
      this.setState({ isFreeDraggingActive: true });
    }
  };

  private toggleGraticule = () => {
    if (this.state.isGraticuleActive) {
      this.setState({ isGraticuleActive: false });
      this.state.mapContext?.layers.toggleGraticule(false);
    } else {
      this.setState({ isGraticuleActive: true });
      this.state.mapContext?.layers.toggleGraticule(true);
    }
  };

  private goToSelectedCoordinates = () => {
    const lonInput = this.state.coordinatesToGo[0].trim() || null;
    const latInput = this.state.coordinatesToGo[1].trim() || null;

    if (!lonInput || !latInput) {
      showMessage(dictionary.errors.failedCoordinates, 'error');
    } else {
      this.state.mapContext?.methods.goToCoordinates([
        Number(lonInput),
        Number(latInput)
      ]);
      this.setState({ coordinatesToGo: ['', ''] });
    }
  };

  private setSessionPlugins = async (
    type: PluginTypes.Coordinates | PluginTypes.Search | PluginTypes.Refresh,
    newSelectionIds: string[]
  ) => {
    await sessionManager.plugins.set(type, newSelectionIds);
    this.setState({ activePlugins: sessionManager.plugins.get() });
  };

  public render() {
    const inStorage = this.state.status !== SAVING_STATUSES.UNSAVED_SESSION;

    return (
      <div className="boiled-app-module-content">
        <div id="boiled-map-container"></div>

        {this.state.mapContext && (
          <React.Fragment>
            <Navigation
              public={this.props.public}
              actions={[
                this.props.public ? [] : [
                  {
                    icon: 'circle-plus',
                    name: dictionary.defaultActions.startNew,
                    onClick: async () => {
                      await sessionManager.reset();
                      location.reload();
                    }
                  },
                  {
                    icon: 'device-floppy',
                    name: dictionary.defaultActions.save,
                    onClick: inStorage ? undefined : () => this.setState({ isSessionsSaveShown: true }),
                    options: inStorage ? [
                      {
                        title: dictionary.defaultActions.save,
                        onClick: async () => {
                          await sessionManager.save();
                          this.setState({ status: SAVING_STATUSES.SAVED_SESSION });
                        }
                      },
                      {
                        title: dictionary.defaultActions.saveAsNew,
                        onClick: () => this.setState({ isSessionsSaveShown: true })
                      }
                    ] : undefined
                  },
                  {
                    icon: 'files',
                    name: dictionary.actions.mappingSessions,
                    onClick: () => this.setState({ isSessionsTableShown: true })
                  }
                ],
                [
                  {
                    icon: 'list-details',
                    name: dictionary.actions.mappingMapGroups,
                    onClick: () => this.setState({ isMapGroupsShown: true })
                  }
                ],
                [
                  { icon: 'zoom-in', name: dictionary.actions.mappingZoomIn, onClick: this.state.mapContext.methods.zoomIn },
                  { icon: 'zoom-out', name: dictionary.actions.mappingZoomOut, onClick: this.state.mapContext.methods.zoomOut }
                ],
                this.publicMode ? [] : [
                  {
                    icon: 'hand-grab',
                    name: dictionary.actions.mappingFreeDragging,
                    onClick: this.toggleFreeDragging,
                    active: this.state.isFreeDraggingActive
                  }
                ],
                this.publicMode ? [] : [
                  {
                    icon: 'location',
                    name: dictionary.actions.mappingNavigateMe,
                    onClick: this.state.mapContext.methods.goToCurrentCoordinates
                  },
                  {
                    icon: 'viewfinder',
                    name: dictionary.actions.mappingGoToCoordinates,
                    onClick: () => this.setState({ isGoToCoordinatesShown: true })
                  }
                ],
                ...(!this.props.public && this.state.activePlugins[PluginTypes.Search].length ? [
                  [
                    {
                      icon: 'search',
                      name: dictionary.actions.mappingSearch,
                      options: this.state.activePlugins[PluginTypes.Search].map(plugin => ({
                        title: plugin.data.name,
                        onClick: async () => {
                          await pluginsManager.evaluate(plugin._id);
                          mapContext.refresh.run(false);
                        }
                      }))
                    }
                  ]
                ] : []),
                [
                  {
                    icon: 'stack',
                    name: dictionary.actions.mappingLayers,
                    onClick: () => this.setState({ isLayerManagerShown: true })
                  }
                ],
                this.publicMode ? [] : [
                  {
                    icon: 'table',
                    name: dictionary.actions.mappingGraticule,
                    onClick: this.toggleGraticule
                  }
                ],
                [
                  {
                    icon: 'camera',
                    name: dictionary.actions.mappingSnapshot,
                    onClick: snapshot
                  }
                ],
                this.props.public ? [] : [
                  {
                    icon: 'refresh',
                    name: dictionary.actions.mappingRefresh,
                    onClick: this.state.mapContext!.refresh.run
                  },
                  {
                    icon: this.state.intervalToRefresh ? 'time-duration-' + this.state.intervalToRefresh : 'time-duration-0',
                    name: dictionary.actions.mappingRefreshInterval,
                    active: !!this.state.intervalToRefresh,
                    onClick: this.state.intervalToRefresh ? () => this.toggleIntervalToRefresh(null) : undefined,
                    options: this.state.intervalToRefresh ? undefined : [
                      {
                        title: 15 + dictionary.measurements.seconds,
                        onClick: () => this.toggleIntervalToRefresh(15)
                      },
                      {
                        title: 30 + dictionary.measurements.seconds,
                        onClick: () => this.toggleIntervalToRefresh(30)
                      },
                      {
                        title: 45 + dictionary.measurements.seconds,
                        onClick: () => this.toggleIntervalToRefresh(45)
                      },
                      {
                        title: 60 + dictionary.measurements.seconds,
                        onClick: () => this.toggleIntervalToRefresh(60)
                      }
                    ]
                  }
                ]
              ]}
              secondaryActions={this.props.public ? undefined : [
                [
                  {
                    icon: 'polygon',
                    name: dictionary.actions.mappingAddGeometry,
                    active: !!this.state.activeDrawType && !this.state.activeDrawType.endsWith('#measurement'),
                    onClick: this.state.activeDrawType ? () => this.toggleDrawing(null) : undefined,
                    options: this.state.activeDrawType ? undefined : [
                      {
                        title: dictionary.actions.mappingAddGeometryLine,
                        onClick: () => this.toggleDrawing('LineString'),
                        active: this.state.activeDrawType === 'LineString'
                      },
                      {
                        title: dictionary.actions.mappingAddGeometryCircle,
                        onClick: () => this.toggleDrawing('Circle'),
                        active: this.state.activeDrawType === 'Circle'
                      },
                      {
                        title: dictionary.actions.mappingAddGeometryPolygon,
                        onClick: () => this.toggleDrawing('Polygon'),
                        active: this.state.activeDrawType === 'Polygon'
                      },
                      {
                        title: dictionary.actions.mappingAddGeometryArrow,
                        onClick: () => this.toggleDrawing('ArrowString'),
                        active: this.state.activeDrawType === 'ArrowString'
                      }
                    ]
                  },
                  {
                    icon: 'ruler-3',
                    name: dictionary.actions.mappingMeasurement,
                    active: !!this.state.activeDrawType && this.state.activeDrawType.endsWith('#measurement'),
                    onClick: this.state.activeDrawType ? () => this.toggleDrawing(null) : undefined,
                    options: this.state.activeDrawType ? undefined : [
                      {
                        title: dictionary.actions.mappingMeasurementLine,
                        onClick: () => this.toggleMeasurement('LineString#measurement'),
                        active: this.state.activeDrawType === 'LineString#measurement'
                      },
                      {
                        title: dictionary.actions.mappingMeasurementArea,
                        onClick: () => this.toggleMeasurement('Polygon#measurement'),
                        active: this.state.activeDrawType === 'Polygon#measurement'
                      }
                    ]
                  }
                ],
                [
                  {
                    icon: 'plug',
                    name: dictionary.actions.mappingPlugins,
                    options: [
                      {
                        title: dictionary.labels.titlePluginTypeCoordinates,
                        onClick: () => this.setState({ pluginSelectionOpenType: PluginTypes.Coordinates })
                      },
                      {
                        title: dictionary.labels.titlePluginTypeSearch,
                        onClick: () => this.setState({ pluginSelectionOpenType: PluginTypes.Search })
                      },
                      {
                        title: dictionary.labels.titlePluginTypeRefresh,
                        onClick: () => this.setState({ pluginSelectionOpenType: PluginTypes.Refresh })
                      }
                    ]
                  }
                ]
              ]}
            />

            <SidePanel
              isOpen={this.state.isSessionsTableShown}
              edge="left"
              maxWidth={600}
              content={<SessionsTable />}
              dataTest="session-table"
              onCloseStart={() => this.setState({ isSessionsTableShown: false })}
            />
            <SidePanel
              isOpen={this.state.isLayerManagerShown}
              edge="right"
              maxWidth={600}
              content={<LayersManager onToggle={this.toggleLayer} />}
              dataTest="layer-manager"
              onCloseStart={() => this.setState({ isLayerManagerShown: false })}
            />
            <SidePanel
              isOpen={this.state.isMapGroupsShown}
              edge="right"
              maxWidth={600}
              content={(
                <MapGroupsTable
                  onClick={(mapPointsGroupId: string) => {
                    this.setState({
                      isMapGroupsShown: false,
                      isMapPointsShown: true,
                      mapPointsGroupId
                    });
                  }}
                />
              )}
              submitText={dictionary.defaultActions.create}
              onSubmit={this.publicMode ? undefined : () => {
                this.setState({ isMapGroupsShown: false });
                overlayManager.open('groupCreate');
              }}
              dataTest="map-groups"
              onCloseStart={() => this.setState({ isMapGroupsShown: false })}
            />
            <SidePanel
              isOpen={this.state.isMapPointsShown}
              edge="right"
              maxWidth={600}
              content={(
                <MapPointsTable
                  groupId={this.state.mapPointsGroupId}
                  onClick={point => {
                this.state.mapContext!.methods.goToCoordinates(point.coordinates);
                this.setState({ isMapPointsShown: false, mapPointsGroupId: '' });
                  }}
                />
              )}
              dataTest="points-table"
              onCloseStart={() => this.setState({ isMapPointsShown: false })}
            />
            <InputModal
              isOpen={this.state.isGoToCoordinatesShown}
              onCloseStart={() => this.setState({ isGoToCoordinatesShown: false })}
              inputs={[
                {
                  id: 'lon',
                  title: dictionary.labels.inputLongitude,
                  value: this.state.coordinatesToGo[0]
                },
                {
                  id: 'lat',
                  title: dictionary.labels.inputLatitude,
                  value: this.state.coordinatesToGo[1]
                }
              ]}
              onChange={(id, value) => {
                if (id === 'lon') {
                  this.setState({ coordinatesToGo: [value as string, this.state.coordinatesToGo[1]] });
                }

                if (id === 'lat') {
                  this.setState({ coordinatesToGo: [this.state.coordinatesToGo[0], value as string] });
                }
              }}
              submitText={dictionary.actions.mappingGoToCoordinates}
              onSubmit={this.goToSelectedCoordinates}
            />
            <BottomMeasures mapContext={this.state.mapContext} />
            <ContextMenu mapContext={this.state.mapContext} />

            {!this.props.public && (
              <React.Fragment>
                <PointForm />
                <GroupForm />

                <SearchPluginInput />

                <InputModal
                  isOpen={this.state.isSessionsSaveShown}
                  onCloseStart={() => {
                    this.setState({
                      sessionName: '',
                      isSessionsSaveShown: false
                    });
                  }}
                  inputs={[
                    {
                      id: 'name',
                      title: dictionary.defaultActions.nameInputLabel,
                      value: this.state.sessionName
                    }
                  ]}
                  onChange={(id, value) => {
                    if (id === 'name') {
                      this.setState({ sessionName: value as string });
                    }
                  }}
                  submitText={dictionary.defaultActions.save}
                  disabledSubmit={!this.state.sessionName.trim()}
                  onSubmit={async () => {
                    await sessionManager.save(this.state.sessionName);
                    this.setState({
                      initialSessionName: this.state.sessionName,
                      status: SAVING_STATUSES.SAVED_SESSION
                    });
                  }}
                />

                {[
                  PluginTypes.Coordinates as const,
                  PluginTypes.Search as const,
                  PluginTypes.Refresh as const
                ].map(type => (
                  <PluginsSelector
                    key={type}
                    isOpen={this.state.pluginSelectionOpenType === type}
                    type={type}
                    onSubmit={selection => {
                      this.setSessionPlugins(type, selection);
                    }}
                    onCloseStart={() => this.setState({ pluginSelectionOpenType: null })}
                  />
                ))}

                <div className="interface-primary-navigation storage z-depth-1">
                  <div>
                    <Button
                      icon={this.statuses[this.state.status].icon}
                      tooltip={this.statuses[this.state.status].message}
                      disabled={this.state.status !== SAVING_STATUSES.UNSAVED_CHANGES}
                      onClick={
                        this.state.status === SAVING_STATUSES.UNSAVED_CHANGES ?
                          () => sessionManager.load(sessionManager.status().id) :
                          undefined
                      }
                      tooltipPosition="right"
                    />
                  </div>
                  {this.state.initialSessionName && (
                    <div>
                      {this.state.initialSessionName}
                    </div>
                  )}
                </div>
              </React.Fragment>
            )}
          </React.Fragment>
        )}
        <input
          type="file"
          onChange={event => {
            const file = (event.target.files as FileList)[0];
            sessionManager.import(file);

            this.state.mapContext!.refresh.run();
          }}
          ref={this.uploadLocalSessionRef}
          style={{ display: 'none' }}
        />
      </div>
    );
  }
}
