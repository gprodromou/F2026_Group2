// workouts.js: the frontend side of Marius's workout endpoints, through the API client.
// The workout history screen calls this with the filter it gets from FilterBar:
//
//   const api = useApi();
//   <FilterBar onChange={(filter) => listWorkouts(api, filter).then(setWorkouts)} />
//
// The server narrows the dates (?from=&to=), and applyFilter narrows the type,
// because GET /workouts does not filter by type.

import { NO_FILTER, filterToQuery, applyFilter } from '../lib/workoutFilter';

export async function listWorkouts(api, filter = NO_FILTER) {
  const rows = await api.get(`/workouts${filterToQuery(filter)}`);
  return applyFilter(Array.isArray(rows) ? rows : [], filter);
}
