import { useEffect, useState } from 'react';
import axios from 'axios';
import { Server, Plus, MapPin, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CreateSourceModal = ({ isOpen, onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'manufacturing_plant',
    location: '',
    config: {}
  });
  const [creating, setCreating] = useState(false);
  
  if (!isOpen) return null;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      const response = await axios.post(`${API}/data-sources`, formData);
      toast.success('Data source created successfully');
      onCreated(response.data);
      onClose();
      setFormData({ name: '', type: 'manufacturing_plant', location: '', config: {} });
    } catch (error) {
      console.error('Error creating data source:', error);
      toast.error('Failed to create data source');
    } finally {
      setCreating(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" data-testid="create-source-modal">
      <div className="bg-[#151923] border border-[#2D3748] rounded-sm w-full max-w-lg mx-4 shadow-lg shadow-black/40">
        <div className="border-b border-[#2D3748] p-6 bg-[#1E2330]/50">
          <h2 className="text-xl font-bold text-white" style={{fontFamily: 'Manrope, sans-serif'}}>Add Data Source</h2>
          <p className="text-sm text-slate-400 mt-1">Configure a new data source</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Source Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-[#0B0E14] border border-[#2D3748] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-sm px-3 py-2 text-white text-sm"
              style={{fontFamily: 'Manrope, sans-serif'}}
              placeholder="Atlanta Manufacturing Plant"
              data-testid="source-name-input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Source Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="w-full bg-[#0B0E14] border border-[#2D3748] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-sm px-3 py-2 text-white text-sm"
              style={{fontFamily: 'Manrope, sans-serif'}}
            >
              <option value="manufacturing_plant">Manufacturing Plant</option>
              <option value="quality_sensor">Quality Sensor</option>
              <option value="inventory_system">Inventory System</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="w-full bg-[#0B0E14] border border-[#2D3748] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-sm px-3 py-2 text-white text-sm"
              style={{fontFamily: 'Manrope, sans-serif'}}
              placeholder="Atlanta, GA"
              data-testid="source-location-input"
            />
          </div>
          
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
              data-testid="submit-create-source"
            >
              {creating ? 'Creating...' : 'Create Source'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DataSources = () => {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  useEffect(() => {
    fetchDataSources();
  }, []);
  
  const fetchDataSources = async () => {
    try {
      const response = await axios.get(`${API}/data-sources`);
      setSources(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data sources:', error);
      setLoading(false);
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
          <h1 className="text-4xl font-bold text-white mb-2" style={{fontFamily: 'Manrope, sans-serif', letterSpacing: '-0.02em'}}>Data Sources</h1>
          <p className="text-slate-400" style={{fontFamily: 'Manrope, sans-serif'}}>Manage connections to plant and sensor systems</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-medium shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200"
          style={{fontFamily: 'Manrope, sans-serif'}}
          data-testid="create-source-button"
        >
          <Plus size={18} />
          Add Source
        </button>
      </div>
      
      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sources.map((source) => (
          <div 
            key={source.id} 
            className="bg-[#151923] border border-[#2D3748] rounded-sm p-5 hover:border-[#4B5563] transition-all duration-200"
            data-testid={`source-card-${source.id}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded">
                  <Server size={20} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white" style={{fontFamily: 'Manrope, sans-serif'}}>{source.name}</h3>
                  <p className="text-xs text-slate-500 capitalize" style={{fontFamily: 'JetBrains Mono, monospace'}}>{source.type.replace('_', ' ')}</p>
                </div>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" style={{fontFamily: 'JetBrains Mono, monospace'}}>
                ACTIVE
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <MapPin size={14} />
                <span style={{fontFamily: 'Manrope, sans-serif'}}>{source.location}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Created</span>
                <span className="text-slate-400" style={{fontFamily: 'JetBrains Mono, monospace'}}>
                  {format(new Date(source.created_at), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-[#2D3748]">
              <div className="text-xs text-slate-500 mb-2">Source ID</div>
              <div className="text-xs text-slate-400 font-mono bg-[#0B0E14] px-2 py-1 rounded" style={{fontFamily: 'JetBrains Mono, monospace'}}>
                {source.id}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {sources.length === 0 && (
        <div className="text-center py-16">
          <Server className="mx-auto text-slate-600 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-slate-400 mb-2" style={{fontFamily: 'Manrope, sans-serif'}}>No Data Sources</h3>
          <p className="text-slate-500 mb-6">Add your first data source to get started</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-medium"
            style={{fontFamily: 'Manrope, sans-serif'}}
          >
            Add Source
          </button>
        </div>
      )}
      
      <CreateSourceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreated={fetchDataSources}
      />
    </div>
  );
};

export default DataSources;
