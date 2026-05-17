import React, { useEffect, useState } from 'react';
import { sessionManager } from '../../../../lib/session-manager';
import { DataRow } from '../../../../interface/data-row';
import { ServerStorageItem, SessionDefinition } from '../../../../../types';
import { overlayManager } from '../../../../lib/overlay-manager';
import { sortBy } from 'lodash';
import { dictionary } from '../../../../lib/dictionary';

export const SessionsTable = () => {
  const [sessions, setSessions] = useState<ServerStorageItem<SessionDefinition>[]>([]);

  useEffect(() => {
    sessionManager.definitions()
      .then(sessions => setSessions(sessions));
  });

  return (
    <div className="boiled-sessions-table">
      {sortBy(sessions, 'data.name').map(session => (
        <DataRow
          key={session._id}
          name={session.data.name}
          icon={session._id === sessionManager.status().id ? 'circle-check' : 'circle'}
          onClick={async () => {
            await sessionManager.load(session._id);
          }}
          actions={[
            {
              icon: 'file-download',
              tooltip: dictionary.defaultActions.export,
              onClick: () => sessionManager.export(session.data.name)
            },
            {
              icon: 'trash',
              tooltip: dictionary.defaultActions.delete,
              onClick: () => {
                overlayManager.open('confirm', {
                  message: dictionary.confirmations.deleteSession.replace('{name}', session.data.name),
                  confirmButtonText: dictionary.defaultActions.delete,
                  onConfirm: () => sessionManager.delete(session._id)
                });
              }
            }
          ]}
        />
      ))}
    </div>
  );
};
