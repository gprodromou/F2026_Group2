// TemplateList.test.jsx: checks the admin template list screen.
// The API is replaced by a fake, so no server is needed.

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TemplateList from '../pages/admin/TemplateList';

// The fake API: get gives back one exercise plan and one goal template, del records the call.
const mockApi = {
  get: jest.fn((path) =>
    Promise.resolve(
      path === '/admin/exercise-plans'
        ? [{ exercise_template_id: 1, template_name: 'Leg day', category: 'strength', description: '' }]
        : [{ goal_template_id: 1, template_name: 'Run 5 km', goal_type: 'distance', description: '' }]
    )
  ),
  del: jest.fn(() => Promise.resolve({ deleted: true })),
};

jest.mock('../api/client', () => ({ useApi: () => mockApi }));

function showScreen() {
  render(
    <MemoryRouter>
      <TemplateList />
    </MemoryRouter>
  );
}

beforeEach(() => {
  mockApi.del.mockClear();
});

test('lists both kinds of template', async () => {
  showScreen();
  expect(await screen.findByText('Leg day')).toBeTruthy();
  expect(screen.getByText('Run 5 km')).toBeTruthy();
  expect(screen.getByText('Exercise plan')).toBeTruthy();
  expect(screen.getByText('Goal')).toBeTruthy();
});

test('delete asks for confirmation first, then deletes', async () => {
  showScreen();
  await screen.findByText('Leg day');

  // Press the first Delete button (the Leg day row).
  fireEvent.click(screen.getAllByText('Delete')[0]);

  // The question is shown and nothing was deleted yet.
  expect(screen.getByText(/Are you sure/)).toBeTruthy();
  expect(mockApi.del).not.toHaveBeenCalled();

  // Confirm: now the API is called and the row disappears.
  fireEvent.click(screen.getByText('Yes, delete'));
  await waitFor(() => expect(mockApi.del).toHaveBeenCalledWith('/admin/exercise-plans/1'));
  await waitFor(() => expect(screen.queryByText('Leg day')).toBeNull());
});

test('closing the confirmation does not delete', async () => {
  showScreen();
  await screen.findByText('Run 5 km');

  fireEvent.click(screen.getAllByText('Delete')[1]); // the Run 5 km row
  fireEvent.click(screen.getByText('Close'));

  expect(mockApi.del).not.toHaveBeenCalled();
  expect(screen.getByText('Run 5 km')).toBeTruthy();
});

test('the list shows no Edit button (it comes back with the form in week 7)', async () => {
  showScreen();
  await screen.findByText('Leg day');
  expect(screen.queryByText('Edit')).toBeNull();
  expect(screen.getAllByText('Delete').length).toBe(2);
});