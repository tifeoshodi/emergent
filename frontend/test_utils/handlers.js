const { http, HttpResponse } = require('msw');

const API = 'http://localhost:8000/api';
const API_V2 = 'http://localhost:8000/api';

export const handlers = [
  // Authentication
  http.get(`${API}/users/:id`, ({ params }) => {
    return HttpResponse.json({ id: params.id });
  }),

  // Home page data
  http.get(`${API}/`, () => HttpResponse.json({ status: 'ok' })),
  http.get(`${API}/dashboard/stats`, () =>
    HttpResponse.json({
      total_projects: 0,
      active_projects: 0,
      total_tasks: 0,
      completed_tasks: 0,
      in_progress_tasks: 0,
      overdue_tasks: 0,
      my_tasks: 0,
    })
  ),
  http.get(`${API}/tasks`, () => HttpResponse.json([])),
  http.get(`${API}/projects`, () => HttpResponse.json([])),
  http.get(`${API}/projects/:id/dashboard`, ({ params }) =>
    HttpResponse.json({
      projectId: params.id,
      stats: {
        total_tasks: 0,
        completed_tasks: 0,
      },
    })
  ),
  http.get(`${API}/dashboard/discipline`, () =>
    HttpResponse.json({ users: [] })
  ),

  // Project creation
  http.post(`${API_V2}/projects`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 'proj1', ...body });
  }),
  http.post(`${API}/projects/:id/wbs`, () => HttpResponse.json({})),
  http.post(`${API_V2}/projects/:id/wbs`, () => HttpResponse.json({})),
  http.get(`${API_V2}/projects/:id/wbs`, () => HttpResponse.json([])),
  http.put(`${API_V2}/projects/:id`, async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: params.id, ...body });
  }),

  // Kanban drag
  http.patch(`${API_V2}/tasks/:id`, async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: params.id, ...body });
  }),
];
