import React from 'react';
import { InputModal } from '../../../../interface/input-modal';
import { noop } from 'lodash';
import { overlayManager } from '../../../../lib/overlay-manager';
import { dictionary } from '../../../../lib/dictionary';
import { NullObject } from '../../../../../types';

export const SearchPluginInputControls = {
  open: () => Promise.resolve('')
};
interface SearchPluginInputState {
  query: string;
  label: string;
  isOpen: boolean;
}
export class SearchPluginInput extends React.PureComponent<NullObject, SearchPluginInputState> {
  private resolver? = noop;

  public constructor(props: NullObject) {
    super(props);

    this.state = {
      query: '',
      label: '',
      isOpen: false
    };
  }

  public componentDidMount(): void {
    overlayManager.register('pluginSearch', {
      open: async ({ label }: { label: string }) => {
        this.setState({ isOpen: true, label });

        const promise = new Promise<string>(resolve => {
          this.resolver = resolve;
        });

        return promise;
      },
      close: noop
    });
  }

  public render(): JSX.Element {
    return (
      <InputModal
        isOpen={this.state.isOpen}
        onCloseStart={() => {
          this.setState({ isOpen: false, query: '' });
          if (this.resolver) {
            this.resolver!('');
            this.resolver = undefined;
          }
        }}
        inputs={[
          {
            id: 'query',
            title: this.state.label,
            value: this.state.query
          }
        ]}
        onChange={(id, value) => {
          if (id === 'query') {
            this.setState({ query: value as string });
          }
        }}
        submitText={dictionary.actions.mappingSearch}
        onSubmit={() => {
          this.resolver!(this.state.query);
          this.resolver = undefined;
        }}
      />
    );
  }
}
