import { useState } from 'react';

const steps = [
  'Basic Info',
  'Document Intake',
  'WBS & CPM Preview',
  'Dashboard Seed'
];

export default function ProjectWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '',
    code: '',
    client: '',
    startDate: '',
    endDate: '',
    widgets: {
      gantt: true,
      sCurve: true,
      burndown: true,
    },
  });
  const [loading, setLoading] = useState(false);
  const backend = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001'}/api`;

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (step === 3) {
      setForm((f) => ({
        ...f,
        widgets: { ...f.widgets, [name]: type === 'checkbox' ? checked : value },
      }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const finish = async () => {
    setLoading(true);
    try {
      await fetch(`${backend}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': 'demo-user',
        },
        body: JSON.stringify({
          name: form.name,
          description: form.client,
          start_date: form.startDate,
          end_date: form.endDate || null,
          project_manager_id: 'demo-user',
        }),
      });
      alert('Project created!');
    } catch (err) {
      console.error(err);
      alert('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Project Creation Wizard</h1>
      <h2>{steps[step]}</h2>
      {step === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            name="name"
            placeholder="Project Name"
            value={form.name}
            onChange={handleChange}
          />
          <input
            name="code"
            placeholder="Project Code"
            value={form.code}
            onChange={handleChange}
          />
          <input
            name="client"
            placeholder="Client Name"
            value={form.client}
            onChange={handleChange}
          />
          <input
            type="date"
            name="startDate"
            value={form.startDate}
            onChange={handleChange}
          />
          <input
            type="date"
            name="endDate"
            value={form.endDate}
            onChange={handleChange}
          />
        </div>
      )}
      {step === 1 && (
        <div>
          <p>Upload CTR/MDR documents:</p>
          <input type="file" multiple />
        </div>
      )}
      {step === 2 && (
        <div>
          <p>Preview WBS and run critical path analysis (placeholder).</p>
          <button type="button">Run Critical Path</button>
        </div>
      )}
      {step === 3 && (
        <div>
          <label>
            <input
              type="checkbox"
              name="gantt"
              checked={form.widgets.gantt}
              onChange={handleChange}
            />
            Gantt chart
          </label>
          <label>
            <input
              type="checkbox"
              name="sCurve"
              checked={form.widgets.sCurve}
              onChange={handleChange}
            />
            S-curve
          </label>
          <label>
            <input
              type="checkbox"
              name="burndown"
              checked={form.widgets.burndown}
              onChange={handleChange}
            />
            Burndown chart
          </label>
        </div>
      )}
      <div style={{ marginTop: 20 }}>
        {step > 0 && <button onClick={back}>Back</button>}{' '}
        {step < steps.length - 1 ? (
          <button onClick={next}>Next</button>
        ) : (
          <button onClick={finish} disabled={loading}>
            {loading ? 'Creating...' : 'Finish'}
          </button>
        )}
      </div>
    </main>
  );
}
