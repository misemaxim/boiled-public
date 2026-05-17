import { coordinatesProjection } from './coordinates-projection';

describe('coordinatesProjection', () => {
  const coords = [12.360103, 51.340199] as [number, number];

  test('MGRS', () => {
    const mgrs = coordinatesProjection.MGRS.fromLonLat(coords);
    expect(mgrs).toBe('33U US 16131 90966');

    const reverse = coordinatesProjection.MGRS.toLonLat(mgrs);
    expect(reverse).toEqual([12.360094, 51.340198]);
  });

  test('UTM', () => {
    const utm = coordinatesProjection.UTM.fromLonLat(coords);
    expect(utm).toBe('33 N 316132 5690966');

    const reverse = coordinatesProjection.UTM.toLonLat(utm);
    expect(reverse).toEqual([12.360108, 51.340198]);
  });

  test('DMS', () => {
    const dms = coordinatesProjection.DMS.fromLonLat(coords);
    expect(dms).toBe('51° 20′ 24.72″ N, 012° 21′ 36.37″ E');

    const reverse = coordinatesProjection.DMS.toLonLat(dms);
    expect(reverse).toEqual([12.360103, 51.3402]);
  });
});
