// FilterBar.jsx: the filters for the workout history (RQ07).
// Two date pickers (From, To) and a workout type dropdown, plus a Clear button.
//
// It does NOT fetch anything. Every time the user changes a filter it reports the new
// filter upwards with onChange, and the page does the fetching:
//
//   <FilterBar onChange={(filter) => listWorkouts(api, filter).then(setWorkouts)} />
//
// filter is { from, to, type } (see lib/workoutFilter.js); '' means not chosen.
// An impossible range (From after To) shows an error and is NOT reported, so the page
// never asks the server for a range that cannot have any workouts.
// Clear empties all three and reports NO_FILTER, which means "show everything".

import { useState } from 'react';
import { Button, Input, FormError } from './ui';
import { NO_FILTER, WORKOUT_TYPES, isEmptyFilter, checkRange } from '../lib/workoutFilter';
import './FilterBar.css';

export default function FilterBar({ onChange, types = WORKOUT_TYPES, initial = NO_FILTER }) {
  const [filter, setFilter] = useState({ ...NO_FILTER, ...initial });
  const [error, setError] = useState('');

  // Saves the new filter and reports it, unless the range is impossible.
  function update(next) {
    setFilter(next);
    const rangeError = checkRange(next);
    setError(rangeError || '');
    if (!rangeError && onChange) onChange(next);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    update({ ...filter, [name]: value });
  }

  function handleClear() {
    update({ ...NO_FILTER });
  }

  return (
    <form
      className="filter-bar"
      role="search"
      aria-label="Filter workouts"
      onSubmit={(event) => event.preventDefault()} // Enter in a field must not reload the page
    >
      <div className="filter-bar__fields">
        <Input
          id="filter-from"
          name="from"
          type="date"
          label="From"
          value={filter.from}
          max={filter.to || undefined}
          onChange={handleChange}
        />
        <Input
          id="filter-to"
          name="to"
          type="date"
          label="To"
          value={filter.to}
          min={filter.from || undefined}
          onChange={handleChange}
        />

        {/* The UI kit has no dropdown yet, so this uses the same classes as Input. */}
        <div className="field">
          <label htmlFor="filter-type" className="field__label">Workout type</label>
          <select
            id="filter-type"
            name="type"
            className="field__input"
            value={filter.type}
            onChange={handleChange}
          >
            <option value="">All types</option>
            {types.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <div className="field__error" />
        </div>

        <div className="filter-bar__actions">
          <Button variant="secondary" onClick={handleClear} disabled={isEmptyFilter(filter)}>
            Clear filters
          </Button>
        </div>
      </div>

      <FormError message={error} id="filter-error" />
    </form>
  );
}
