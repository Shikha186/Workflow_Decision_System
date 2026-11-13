import { useState } from 'react';
import axios from 'axios';

function App() {
  const [creditScore, setCreditScore] = useState('');
  const [result, setResult] = useState(null);
  const [auditLog, setAuditLog] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setAuditLog(null);

    try {
      // 1. Submit the payload to the decision engine
      const processRes = await axios.post('/api/workflows/process', {
        workflowName: "Loan Approval",
        payload: { creditScore: Number(creditScore) }
      });
      
      setResult(processRes.data);

      // 2. Automatically fetch the audit trail to prove explainability
      if (processRes.data.requestId) {
        const auditRes = await axios.get(`/api/workflows/audit/${processRes.data.requestId}`);
        setAuditLog(auditRes.data.auditTrail);
      }
    } catch (error) {
      alert(error.response?.data?.error || "External Dependency Failed or Network Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Workflow Decision Engine</h1>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
        <label>
          <strong>Enter Credit Score: </strong>
          <input 
            type="number" 
            value={creditScore} 
            onChange={(e) => setCreditScore(e.target.value)} 
            required 
            style={{ padding: '0.5rem', marginLeft: '1rem' }}
          />
        </label>
        <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem', marginLeft: '1rem', cursor: 'pointer' }}>
          {loading ? 'Evaluating...' : 'Run Workflow'}
        </button>
      </form>

      {result && (
        <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '1rem' }}>
          <h2>Decision Result</h2>
          <p><strong>Status:</strong> {result.status}</p>
          <p><strong>Final Stage:</strong> {result.currentStage}</p>
          <p><strong>Request ID:</strong> {result.requestId}</p>
        </div>
      )}

      {auditLog && (
        <div style={{ padding: '1rem', backgroundColor: '#f4f4f4', borderRadius: '8px' }}>
          <h2>Audit Trail (Reasoning)</h2>
          <ul style={{ lineHeight: '1.8' }}>
            {auditLog.map((log, index) => (
              <li key={index}>
                <strong>{log.stageEvaluated}:</strong> {log.decision} 
                {log.ruleTriggered && <span style={{ color: 'blue' }}> (Rule: {log.ruleTriggered})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
