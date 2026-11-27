// in one table, each row with a Delete button.
// Delete first asks "Are you sure?" and only calls the API after the admin confirms.

import { useEffect, useState } from 'react';
import { useApi } from '../../api/client';
import { Button, Modal } from '../../components/ui';

// The two kinds of template: their label, their endpoint, and the names of their columns in the database.
const KINDS = {
  exercise: {
    label: 'Exercise plan',
    path: '/admin/exercise-plans',
    idField: 'exercise_template_id',
    typeField: 'category',
  },
  goal: {
    label: 'Goal',
    path: '/admin/goal-templates',
    idField: 'goal_template_id',
    typeField: 'goal_type',
  },
};

// Turns the list the server sends into rows that look the same for both kinds.
function toRows(kind, list) {
  if (!Array.isArray(list)) return [];
  return list.map((item) => ({
    kind,
    id: item[KINDS[kind].idField],
    name: item.template_name,
    type: item[KINDS[kind].typeField],
    description: item.description || '',
  }));
}

export default function TemplateList() {
  const api = useApi();

  const [rows, setRows] = useState([]);       // all templates, both kinds
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');     // a message to show if a request fails
  const [toDelete, setToDelete] = useState(null); // the row waiting for confirmation, or null

  // When the screen opens: ask the server for both lists at the same time.
  useEffect(() => {
    async function load() {
      try {
        const [exercise, goal] = await Promise.all([
          api.get(KINDS.exercise.path),
          api.get(KINDS.goal.path),
        ]);
        setRows([...toRows('exercise', exercise), ...toRows('goal', goal)]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [api]);

  // The admin pressed "Yes, delete" in the confirmation window.
  async function confirmDelete() {
    try {
      await api.del(`${KINDS[toDelete.kind].path}/${toDelete.id}`);
      // Remove the row from the screen without asking the server for the lists again.
      setRows(rows.filter((row) => !(row.kind === toDelete.kind && row.id === toDelete.id)));
    } catch (err) {
      setError(err.message);
    }
    setToDelete(null); // close the confirmation window
  }

  if (loading) return <p>Loading templates...</p>;

  return (
    <section>
      <h1>Templates</h1>

      {error && <p role="alert">{error}</p>}

      {rows.length === 0 ? (
        <p>No templates yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Kind</th>
              <th>Type</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.kind}-${row.id}`}>
                <td>{row.name}</td>
                <td>{KINDS[row.kind].label}</td>
                <td>{row.type}</td>
                <td>{row.description}</td>
                <td>
                  <Button variant="secondary" onClick={() => setToDelete(row)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* The confirmation window. "Close" (from Modal) cancels, "Yes, delete" goes ahead. */}
      <Modal open={toDelete !== null} title="Delete template" onClose={() => setToDelete(null)}>
        {toDelete && <p>Are you sure you want to delete "{toDelete.name}"?</p>}
        <Button onClick={confirmDelete}>Yes, delete</Button>
      </Modal>
    </section>
  );
}