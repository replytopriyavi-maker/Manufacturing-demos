import { useEffect, useState } from 'react';
import axios from 'axios';
import { Shield, Plus, Edit, Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SeverityBadge = ({ severity }) => {
  const config = {
    critical: 'bg-red-500/10 text-red-400 border-red-500/20',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  };
  
  return (
    <span 
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config[severity]}`}
      style={{fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em'}}
    >
      {severity.toUpperCase()}
    </span>
  );
};

const CreateRuleModal = ({ isOpen, onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rule_type: 'completeness',
    field: '',
    condition: {},
    severity: 'high'
  });
  const [creating, setCreating] = useState(false);
  
  if (!isOpen) return null;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      // Parse condition based on rule type
      let condition = {};
      if (formData.rule_type === 'accuracy') {
        condition = { min: parseFloat(formData.min) || 0, max: parseFloat(formData.max) || 100 };
      } else if (formData.rule_type === 'consistency') {
        condition = { pattern: formData.pattern || '' };
      }
      
      const response = await axios.post(`${API}/quality-rules`, {
        ...formData,
        condition
      });
      toast.success('Quality rule created successfully');
      onCreated(response.data);
      onClose();
      setFormData({ name: '', description: '', rule_type: 'completeness', field: '', condition: {}, severity: 'high' });
    } catch (error) {
      console.error('Error creating rule:', error);
      toast.error('Failed to create quality rule');
    } finally {
      setCreating(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" data-testid="create-rule-modal">
      <div className="bg-[#151923] border border-[#2D3748] rounded-sm w-full max-w-2xl mx-4 shadow-lg shadow-black/40">
        <div className="border-b border-[#2D3748] p-6 bg-[#1E2330]/50">
          <h2 className="text-xl font-bold text-white" style={{fontFamily: 'Manrope, sans-serif'}}>Create Quality Rule</h2>
          <p className="text-sm text-slate-400 mt-1">Define a new data validation rule</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Rule Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-[#0B0E14] border border-[#2D3748] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-sm px-3 py-2 text-white text-sm"
              style={{fontFamily: 'Manrope, sans-serif'}}
              placeholder="Temperature Range Check"
              data-testid="rule-name-input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full bg-[#0B0E14] border border-[#2D3748] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-sm px-3 py-2 text-white text-sm"
              style={{fontFamily: 'Manrope, sans-serif'}}
              rows="2"
              placeholder="Describe the validation rule..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Rule Type</label>
              <select
                value={formData.rule_type}
                onChange={(e) => setFormData({...formData, rule_type: e.target.value})}
                className="w-full bg-[#0B0E14] border border-[#2D3748] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-sm px-3 py-2 text-white text-sm"
                style={{fontFamily: 'Manrope, sans-serif'}}
              >
                <option value="completeness">Completeness</option>
                <option value="accuracy">Accuracy</option>
                <option value="consistency">Consistency</option>
                <option value="timeliness">Timeliness</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Severity</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({...formData, severity: e.target.value})}
                className="w-full bg-[#0B0E14] border border-[#2D3748] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-sm px-3 py-2 text-white text-sm"
                style={{fontFamily: 'Manrope, sans-serif'}}
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Field Name</label>
            <input
              type="text"
              required
              value={formData.field}
              onChange={(e) => setFormData({...formData, field: e.target.value})}
              className="w-full bg-[#0B0E14] border border-[#2D3748] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-sm px-3 py-2 text-white text-sm"
              style={{fontFamily: 'JetBrains Mono, monospace'}}
              placeholder="temperature"
            />
          </div>
          
          {formData.rule_type === 'accuracy' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Min Value</label>
                <input
                  type="number"
                  step="any"
                  value={formData.min || ''}
                  onChange={(e) => setFormData({...formData, min: e.target.value})}
                  className="w-full bg-[#0B0E14] border border-[#2D3748] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-sm px-3 py-2 text-white text-sm"
                  style={{fontFamily: 'JetBrains Mono, monospace'}}
                  placeholder="2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Max Value</label>
                <input
                  type="number"
                  step="any"
                  value={formData.max || ''}
                  onChange={(e) => setFormData({...formData, max: e.target.value})}
                  className="w-full bg-[#0B0E14] border border-[#2D3748] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-sm px-3 py-2 text-white text-sm"
                  style={{fontFamily: 'JetBrains Mono, monospace'}}
                  placeholder="8"
                />
              </div>
            </div>
          )}
          
          {formData.rule_type === 'consistency' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Expected Pattern</label>
              <input
                type="text"
                value={formData.pattern || ''}
                onChange={(e) => setFormData({...formData, pattern: e.target.value})}
                className="w-full bg-[#0B0E14] border border-[#2D3748] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-sm px-3 py-2 text-white text-sm"
                style={{fontFamily: 'JetBrains Mono, monospace'}}
                placeholder="BATCH_"
              />
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[#1E2330] hover:bg-[#2D3748] text-slate-200 border border-[#2D3748] rounded-sm font-medium transition-all duration-200"
              style={{fontFamily: 'Manrope, sans-serif'}}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-medium shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200 disabled:opacity-50"
              style={{fontFamily: 'Manrope, sans-serif'}}
            >
              {creating ? 'Creating...' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DataQuality = () => {
  const [rules, setRules] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  useEffect(() => {
    fetchQualityRules();
    fetchQualityResults();
  }, []);
  
  const fetchQualityRules = async () => {
    try {
      const response = await axios.get(`${API}/quality-rules`);
      setRules(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching quality rules:', error);
      setLoading(false);
    }
  };
  
  const fetchQualityResults = async () => {
    try {
      const response = await axios.get(`${API}/quality-results?limit=50`);
      setResults(response.data);
    } catch (error) {
      console.error('Error fetching quality results:', error);
    }
  };
  
  const toggleRuleStatus = async (rule) => {
    try {
      await axios.put(`${API}/quality-rules/${rule.id}`, { active: !rule.active });
      toast.success(`Rule ${!rule.active ? 'activated' : 'deactivated'}`);
      fetchQualityRules();
    } catch (error) {
      console.error('Error updating rule:', error);
      toast.error('Failed to update rule');
    }
  };
  
  // Aggregate results by rule
  const ruleStats = rules.map(rule => {
    const ruleResults = results.filter(r => r.rule_id === rule.id);
    const avgScore = ruleResults.length > 0
      ? ruleResults.reduce((sum, r) => sum + r.quality_score, 0) / ruleResults.length
      : 0;
    const lastCheck = ruleResults[0];
    
    return {
      ...rule,
      avgScore: avgScore.toFixed(2),
      lastCheck,
      totalChecks: ruleResults.length
    };
  });
  
  // Quality trend data
  const qualityTrendData = results.slice(0, 20).map(item => ({
    timestamp: format(new Date(item.timestamp), 'HH:mm'),
    score: item.quality_score,
    rule: item.rule_name
  })).reverse();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-blue-400" size={40} />
      </div>
    );
  }
  
  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2" style={{fontFamily: 'Manrope, sans-serif', letterSpacing: '-0.02em'}}>Data Quality Center</h1>
          <p className="text-slate-400" style={{fontFamily: 'Manrope, sans-serif'}}>Monitor and manage data validation rules</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-medium shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200"
          style={{fontFamily: 'Manrope, sans-serif'}}
          data-testid="create-rule-button"
        >
          <Plus size={18} />
          Create Rule
        </button>
      </div>
      
      {/* Quality Trend Chart */}
      {qualityTrendData.length > 0 && (
        <div className="bg-[#151923] border border-[#2D3748] rounded-sm mb-6">
          <div className="border-b border-[#2D3748] p-4 bg-[#1E2330]/50">
            <h2 className="text-lg font-semibold text-white" style={{fontFamily: 'Manrope, sans-serif'}}>Quality Score Trend</h2>
            <p className="text-xs text-slate-400 mt-1">Recent validation results</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={qualityTrendData}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#64748B" 
                  style={{fontSize: '11px', fontFamily: 'JetBrains Mono, monospace'}}
                />
                <YAxis 
                  stroke="#64748B" 
                  domain={[0, 100]}
                  style={{fontSize: '11px', fontFamily: 'JetBrains Mono, monospace'}}
                />
                <Tooltip 
                  contentStyle={{background: '#151923', border: '1px solid #2D3748', borderRadius: '2px'}}
                  labelStyle={{color: '#F8FAFC', fontFamily: 'JetBrains Mono, monospace'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  fill="url(#scoreGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {/* Quality Rules */}
      <div className="bg-[#151923] border border-[#2D3748] rounded-sm">
        <div className="border-b border-[#2D3748] p-4 bg-[#1E2330]/50">
          <h2 className="text-lg font-semibold text-white" style={{fontFamily: 'Manrope, sans-serif'}}>Validation Rules</h2>
          <p className="text-xs text-slate-400 mt-1">Active data quality checks</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1E2330]/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide" style={{fontFamily: 'Manrope, sans-serif', letterSpacing: '0.05em'}}>Rule Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide" style={{fontFamily: 'Manrope, sans-serif', letterSpacing: '0.05em'}}>Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide" style={{fontFamily: 'Manrope, sans-serif', letterSpacing: '0.05em'}}>Field</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide" style={{fontFamily: 'Manrope, sans-serif', letterSpacing: '0.05em'}}>Severity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide" style={{fontFamily: 'Manrope, sans-serif', letterSpacing: '0.05em'}}>Avg Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide" style={{fontFamily: 'Manrope, sans-serif', letterSpacing: '0.05em'}}>Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide" style={{fontFamily: 'Manrope, sans-serif', letterSpacing: '0.05em'}}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D3748]">
              {ruleStats.map((rule) => (
                <tr key={rule.id} className="hover:bg-[#1E2330] transition-colors" data-testid={`rule-row-${rule.id}`}>
                  <td className="px-4 py-3">
                    <div className="text-sm text-slate-200 font-medium" style={{fontFamily: 'Manrope, sans-serif'}}>{rule.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{rule.description}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-300 capitalize" style={{fontFamily: 'JetBrains Mono, monospace'}}>{rule.rule_type}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300" style={{fontFamily: 'JetBrains Mono, monospace'}}>{rule.field}</td>
                  <td className="px-4 py-3"><SeverityBadge severity={rule.severity} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium" style={{fontFamily: 'JetBrains Mono, monospace', color: rule.avgScore >= 90 ? '#10B981' : rule.avgScore >= 70 ? '#F59E0B' : '#EF4444'}}>
                        {rule.avgScore}%
                      </span>
                      <span className="text-xs text-slate-500">({rule.totalChecks})</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      rule.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`} style={{fontFamily: 'JetBrains Mono, monospace'}}>
                      {rule.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleRuleStatus(rule)}
                      className="px-3 py-1 bg-[#1E2330] hover:bg-[#2D3748] text-slate-200 border border-[#2D3748] rounded-sm text-xs transition-all duration-200"
                      data-testid={`toggle-rule-${rule.id}`}
                    >
                      {rule.active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {rules.length === 0 && (
          <div className="text-center py-12">
            <Shield className="mx-auto text-slate-600 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-slate-400 mb-2" style={{fontFamily: 'Manrope, sans-serif'}}>No Quality Rules</h3>
            <p className="text-slate-500 mb-6">Create your first quality rule to start monitoring</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-medium"
              style={{fontFamily: 'Manrope, sans-serif'}}
            >
              Create Rule
            </button>
          </div>
        )}
      </div>
      
      <CreateRuleModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreated={fetchQualityRules}
      />
    </div>
  );
};

export default DataQuality;
