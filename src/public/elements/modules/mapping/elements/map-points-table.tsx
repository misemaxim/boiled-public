import React, { useEffect, useState } from 'react';
import { sessionManager } from '../../../../lib/session-manager';
import { DataRow } from '../../../../interface/data-row';
import { mapContext } from '../lib/map-service';
import { overlayManager } from '../../../../lib/overlay-manager';
import { sortBy } from 'lodash';
import { dictionary } from '../../../../lib/dictionary';
import { isPublicMode } from '../lib/is-public-mode';
import { PointData } from '../../../../../types';

export const MapPointsTable = (props: {
  groupId: string;
  onClick: (point: PointData) => void;
}) => {
  const [points, setPoints] = useState<PointData[]>([]);

  useEffect(() => {
    setPoints(sessionManager.get().points[props.groupId] || []);
  }, []);

  return (
    <div className="boiled-map-groups-table">
      {sortBy(points, 'name').map(point => (
        <DataRow
          key={point.id}
          name={point.name}
          onClick={() => props.onClick(point)}
          actions={[
            {
              icon: 'info-circle',
              tooltip: dictionary.defaultActions.information,
              onClick: () => {
                overlayManager.open('pointInfo', point);
              }
            },
            ...(isPublicMode() ? [] : [
              {
                icon: 'edit',
                tooltip: dictionary.defaultActions.edit,
                onClick: () => {
                  overlayManager.open('pointEdit', point);
                }
              },
              {
                icon: 'trash',
                tooltip: dictionary.defaultActions.delete,
                onClick: () => {
                  overlayManager.open('confirm', {
                    message: dictionary.confirmations.deletePoint.replace('{name}', point.name),
                    confirmButtonText: dictionary.defaultActions.delete,
                    onConfirm: () => mapContext.points.delete([point.group, point.id])
                  });
                }
              }
            ])
          ]}
        />
      ))}
    </div>
  );
};
