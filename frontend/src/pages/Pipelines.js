import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Play, Pause, Trash2, Edit, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StatusBadge = ({ status }) => {
  const statusConfig = {
    active: { label: 'ACTIVE', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle },
    draft: { label: 'DRAFT', class: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: Edit },
    paused: { label: 'PAUSED', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Pause }
  };
  
  const config = statusConfig[status] || statusConfig.draft;
  const Icon = config.icon;
  
  return (
    <span 
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${config.class}`}
      style={{fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em'}}
    >
      <Icon size={12} />
      {config.label}
    </span>
  );
};

const CreatePipelineModal = ({ isOpen, onClose, onCreated, dataSources }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    source_id: '',
    transformations: [],
    schedule: ''
  });
  const [creating, setCreating] = useState(false);
  
  if (!isOpen) return null;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      const response = await axios.post(`${API}/pipelines`, formData);
      toast.success('Pipeline created successfully');
      onCreated(response.data);
      onClose();
      setFormData({ name: '', description: '', source_id: '', transformations: [], schedule: '' });
    } catch (error) {
      console.error('Error creating pipeline:', error);
      toast.error('Failed to create pipeline');
    } finally {
      setCreating(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" data-testid="create-pipeline-modal">
      <div className="bg-[#151923] border border-[#2D3748] rounded-sm w-full max-w-2xl mx-4 shadow-lg shadow-black/40">
        <div className="border-b border-[#2D3748] p-6 bg-[#1E2330]/50">
          <h2 className="text-xl font-bold text-white" style={{fontFamily: 'Manrope, sans-serif'}}>Create New Pipeline</h2>
          <p className="text-sm text-slate-400 mt-1">Configure your data pipeline</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Pipeline Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-[#0B0E14] border border-[#2D3748] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-sm px-3 py-2 text-white text-sm"
              style={{fontFamily: 'JetBrains Mono, monospace'}}
              placeholder="Production Data ETL"
              data-testid="pipeline-name-input"
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
              rows="3"
              placeholder="Describe what this pipeline does..."
              data-testid="pipeline-description-input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Data Source</label>
            <select
              required
              value={formData.source_id}
              onChange={(e) => setFormData({...formData, source_id: e.target.value})}
              className="w-full bg-[#0B0E14] border border-[#2D3748] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-sm px-3 py-2 text-white text-sm"
              style={{fontFamily: 'Manrope, sans-serif'}}
              data-testid="pipeline-source-select"
            >
              <option value="">Select a data source</option>
              {dataSources.map(source => (
                <option key={source.id} value={source.id}>{source.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Schedule (Cron)</label>
            <input
              type="text"
              value={formData.schedule}
              onChange={(e) => setFormData({...formData, schedule: e.target.value})}
              className="w-full bg-[#0B0E14] border border-[#2D3748] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-sm px-3 py-2 text-white text-sm"
              style={{fontFamily: 'JetBrains Mono, monospace'}}
              placeholder="0 */6 * * * (Every 6 hours)"
              data-testid="pipeline-schedule-input"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[#1E2330] hover:bg-[#2D3748] text-slate-200 border border-[#2D3748] rounded-sm font-medium transition-all duration-200"
              style={{fontFamily: 'Manrope, sans-serif'}}
              data-testid="cancel-create-pipeline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-medium shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200 disabled:opacity-50"
              style={{fontFamily: 'Manrope, sans-serif'}}
              data-testid="submit-create-pipeline"
            >
              {creating ? 'Creating...' : 'Create Pipeline'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Pipelines = () => {
  const [pipelines, setPipelines] = useState([]);
  const [dataSources, setDataSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [executing, setExecuting] = useState({});
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchPipelines();
    fetchDataSources();
  }, []);
  
  const fetchPipelines = async () => {
    try {
      const response = await axios.get(`${API}/pipelines`);
      setPipelines(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching pipelines:', error);
      setLoading(false);
    }
  };
  
  const fetchDataSources = async () => {
    try {
      const response = await axios.get(`${API}/data-sources`);
      setDataSources(response.data);
    } catch (error) {
      console.error('Error fetching data sources:', error);
    }
  };
  
  const handleExecute = async (pipelineId) => {
    setExecuting(prev => ({...prev, [pipelineId]: true}));
    toast.info('Starting pipeline execution...');
    
    try {
      const response = await axios.post(`${API}/pipelines/${pipelineId}/execute`);
      if (response.data.status === 'success') {
        toast.success('Pipeline executed successfully');
      } else if (response.data.status === 'failed') {
        toast.error(`Pipeline failed: ${response.data.error_message}`);
      }
    } catch (error) {
      console.error('Error executing pipeline:', error);
      toast.error('Failed to execute pipeline');
    } finally {
      setExecuting(prev => ({...prev, [pipelineId]: false}));
    }
  };
  
  const handleToggleStatus = async (pipeline) => {
    const newStatus = pipeline.status === 'active' ? 'paused' : 'active';
    try {
      await axios.put(`${API}/pipelines/${pipeline.id}`, { status: newStatus });
      toast.success(`Pipeline ${newStatus === 'active' ? 'activated' : 'paused'}`);
      fetchPipelines();
    } catch (error) {
      console.error('Error updating pipeline:', error);
      toast.error('Failed to update pipeline');
    }
  };
  
  const handleDelete = async (pipelineId) => {
    if (!window.confirm('Are you sure you want to delete this pipeline?')) return;
    
    try {
      await axios.delete(`${API}/pipelines/${pipelineId}`);
      toast.success('Pipeline deleted');
      fetchPipelines();
    } catch (error) {
      console.error('Error deleting pipeline:', error);
      toast.error('Failed to delete pipeline');
    }
  };
  
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
          <h1 className="text-4xl font-bold text-white mb-2" style={{fontFamily: 'Manrope, sans-serif', letterSpacing: '-0.02em'}}>Data Pipelines</h1>
          <p className="text-slate-400" style={{fontFamily: 'Manrope, sans-serif'}}>Manage and monitor your ETL pipelines</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-medium shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200"
          style={{fontFamily: 'Manrope, sans-serif'}}
          data-testid="create-pipeline-button"
        >
          <Plus size={18} />
          Create Pipeline
        </button>
      </div>
      
      {/* Pipelines Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {pipelines.map((pipeline) => (
          <div 
            key={pipeline.id} 
            className="bg-[#151923] border border-[#2D3748] rounded-sm hover:border-[#4B5563] transition-all duration-200"
            data-testid={`pipeline-card-${pipeline.id}`}
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 
                    className="text-lg font-semibold text-white mb-1 cursor-pointer hover:text-blue-400 transition-colors"
                    style={{fontFamily: 'Manrope, sans-serif'}}
                    onClick={() => navigate(`/pipelines/${pipeline.id}`)}
                    data-testid={`pipeline-name-${pipeline.id}`}
                  >
                    {pipeline.name}
                  </h3>
                  <p className="text-sm text-slate-400 line-clamp-2" style={{fontFamily: 'Manrope, sans-serif'}}>{pipeline.description}</p>
                </div>
                <StatusBadge status={pipeline.status} />
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Transformations</span>
                  <span className="text-slate-300" style={{fontFamily: 'JetBrains Mono, monospace'}}>{pipeline.transformations?.length || 0}</span>
                </div>
                {pipeline.schedule && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Schedule</span>
                    <span className="text-slate-300" style={{fontFamily: 'JetBrains Mono, monospace'}}>{pipeline.schedule}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Created</span>
                  <span className="text-slate-400" style={{fontFamily: 'JetBrains Mono, monospace'}}>
                    {format(new Date(pipeline.created_at), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2 pt-3 border-t border-[#2D3748]">
                <button
                  onClick={() => handleExecute(pipeline.id)}
                  disabled={executing[pipeline.id]}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-sm font-medium transition-all duration-200 disabled:opacity-50"
                  style={{fontFamily: 'Manrope, sans-serif'}}
                  data-testid={`execute-pipeline-${pipeline.id}`}
                >
                  {executing[pipeline.id] ? (
                    <><Loader2 size={14} className="animate-spin" /> Executing...</>
                  ) : (
                    <><Play size={14} /> Execute</>
                  )}
                </button>
                <button
                  onClick={() => handleToggleStatus(pipeline)}
                  className="px-3 py-2 bg-[#1E2330] hover:bg-[#2D3748] text-slate-200 border border-[#2D3748] rounded-sm text-sm transition-all duration-200"
                  data-testid={`toggle-status-${pipeline.id}`}
                >
                  {pipeline.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button
                  onClick={() => handleDelete(pipeline.id)}
                  className="px-3 py-2 bg-[#1E2330] hover:bg-red-600/20 text-slate-200 hover:text-red-400 border border-[#2D3748] hover:border-red-500/20 rounded-sm text-sm transition-all duration-200"
                  data-testid={`delete-pipeline-${pipeline.id}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {pipelines.length === 0 && (
        <div className="text-center py-16" data-testid="no-pipelines-message">
          <AlertCircle className="mx-auto text-slate-600 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-slate-400 mb-2" style={{fontFamily: 'Manrope, sans-serif'}}>No Pipelines Yet</h3>
          <p className="text-slate-500 mb-6">Create your first pipeline to get started</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-medium"
            style={{fontFamily: 'Manrope, sans-serif'}}
          >
            Create Pipeline
          </button>
        </div>
      )}
      
      <CreatePipelineModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreated={fetchPipelines}
        dataSources={dataSources}
      />
    </div>
  );
};

export default Pipelines;
