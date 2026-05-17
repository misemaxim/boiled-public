import React from 'react';
import { PluginDefinition, PluginTypes, ServerStorageItem } from '../../../../../types';
import { sessionManager } from '../../../../lib/session-manager';
import { BaseModal } from '../../../../interface/base-modal';
import { pluginsManager } from '../lib/plugins-manager';
import { DataRow } from '../../../../interface/data-row';
import { dictionary } from '../../../../lib/dictionary';

interface PluginsSelectorProps {
  type: PluginTypes;
  groupId?: string;
  isOpen: boolean;
  onCloseStart: () => void;
  onSubmit: (ids: string[]) => void;
}
interface PluginsSelectorState {
  isOpen: boolean;
  selectedStateIds: Record<string, boolean>;
  plugins: ServerStorageItem<PluginDefinition>[];
}
export class PluginsSelector extends React.PureComponent<PluginsSelectorProps, PluginsSelectorState> {
  private savedSelectedStateIds: PluginsSelectorState['selectedStateIds'] = {};

  public constructor(props: PluginsSelectorProps) {
    super(props);

    this.state = {
      isOpen: false,
      selectedStateIds: {},
      plugins: []
    };
  }

  public async componentDidMount(): Promise<void> {
    const session = sessionManager.get();
    const plugins = (await pluginsManager.definitions()).filter(plugin => plugin.data.type === this.props.type);

    const selectedStateIds: PluginsSelectorState['selectedStateIds'] = {};

    const setAvailableIds = (type: PluginTypes) => {
      plugins.filter(plugin => plugin.data.type === type).forEach(plugin => {
        if (!selectedStateIds[plugin._id]) {
          selectedStateIds[plugin._id] = false;
        }
      });
    };
    const setSelectedIdsByType = () => {
      session.plugins.filter(id => {
        return plugins.find(plugin => plugin._id === id);
      }).forEach(id => {
        selectedStateIds[id] = true;
      });
    };

    if (this.props.type === PluginTypes.Point) {
      session.groups.find(group => group.id === this.props.groupId)?.plugins.forEach(id => {
        selectedStateIds[id] = true;
      });
      setAvailableIds(PluginTypes.Point);
    } else {
      setSelectedIdsByType();
      setAvailableIds(this.props.type);
    }

    this.savedSelectedStateIds = selectedStateIds;
    this.setState({ selectedStateIds, plugins });
  }

  public componentDidUpdate(): void {
    if (this.props.isOpen === false) {
      this.setState({ selectedStateIds: this.savedSelectedStateIds });
    }
  }

  public render(): JSX.Element {
    return (
      <BaseModal
        isOpen={this.props.isOpen}
        content={(
          <div>
            {this.state.plugins.map(plugin => (
              <DataRow
                key={plugin._id}
                icon={this.state.selectedStateIds[plugin._id] ? 'circle-check' : 'circle'}
                name={plugin.data.name}
                onClick={() => {
                  this.setState({
                    selectedStateIds: {
                      ...this.state.selectedStateIds,
                      [plugin._id]: !this.state.selectedStateIds[plugin._id]
                    }
                  });
                }}
                actions={[]}
              />
            ))}
          </div>
        )}
        onCloseStart={this.props.onCloseStart}
        onSubmit={() => {
          this.savedSelectedStateIds = this.state.selectedStateIds;

          this.props.onSubmit(
            Object.keys(this.state.selectedStateIds).filter(id => this.state.selectedStateIds[id])
          );
        }}
        submitText={dictionary.defaultActions.save}
      />
    );
  }
}