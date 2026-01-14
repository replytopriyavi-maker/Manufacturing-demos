import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Play, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LogViewer = ({ logs }) => {
  const getLogColor = (level) => {
    const colors = {
      INFO: 'text-blue-400',
      SUCCESS: 'text-emerald-400',
      WARNING: 'text-amber-400',
      ERROR: 'text-red-400'
    };
    return colors[level] || 'text-slate-400';
  };
  
  return (
    <div className="bg-[#0B0E14] border border-[#2D3748] rounded-sm p-4 max-h-96 overflow-y-auto" data-testid="log-viewer">
      {logs.map((log, idx) => (
        <div key={idx} className="flex gap-3 mb-2 text-xs" style={{fontFamily: 'JetBrains Mono, monospace'}}>
          <span className="text-slate-600">
            {format(new Date(log.timestamp), 'HH:mm:ss.SSS')}
          </span>
          <span className={`font-medium ${getLogColor(log.level)} w-16`}>
            {log.level}
          </span>
          <span className="text-slate-300 flex-1">{log.message}</span>
        </div>
      ))}
      {logs.length === 0 && (
        <div className="text-slate-500 text-sm text-center py-4">No logs available</div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const statusConfig = {
    success: { label: 'SUCCESS', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
    failed: { label: 'FAILED', class: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle },
    running: { label: 'RUNNING', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse', icon: Loader2 }
  };
  
  const config = statusConfig[status] || statusConfig.success;
  const Icon = config.icon;
  
  return (
    <span 
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${config.class}`}
      style={{fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em'}}
    >
      <Icon size={12} className={status === 'running' ? 'animate-spin' : ''} />
      {config.label}
    </span>
  );
};

const PipelineDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pipeline, setPipeline] = useState(null);
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  
  useEffect(() => {
    fetchPipelineDetails();
    fetchPipelineRuns();
  }, [id]);
  
  const fetchPipelineDetails = async () => {
    try {
      const response = await axios.get(`${API}/pipelines/${id}`);
      setPipeline(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching pipeline:', error);
      setLoading(false);
    }
  };
  
  const fetchPipelineRuns = async () => {
    try {
      const response = await axios.get(`${API}/pipeline-runs?limit=20`);
      const pipelineRuns = response.data.filter(run => run.pipeline_id === id);
      setRuns(pipelineRuns);
      if (pipelineRuns.length > 0) {
        setSelectedRun(pipelineRuns[0]);
      }
    } catch (error) {
      console.error('Error fetching runs:', error);
    }
  };
  
  const handleExecute = async () => {
    setExecuting(true);
    toast.info('Starting pipeline execution...');
    
    try {
      const response = await axios.post(`${API}/pipelines/${id}/execute`);
      if (response.data.status === 'success') {
        toast.success('Pipeline executed successfully');
      } else if (response.data.status === 'failed') {
        toast.error(`Pipeline failed: ${response.data.error_message}`);
      }
      fetchPipelineRuns();
    } catch (error) {
      console.error('Error executing pipeline:', error);
      toast.error('Failed to execute pipeline');
    } finally {
      setExecuting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-blue-400" size={40} />
      </div>
    );
  }
  
  if (!pipeline) {
    return (
      <div className="flex items-center justify-center h-screen text-slate-400">
        Pipeline not found
      </div>
    );
  }
  
  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/pipelines')}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          data-testid="back-button"
        >
          <ArrowLeft size={18} />
          <span style={{fontFamily: 'Manrope, sans-serif'}}>Back to Pipelines</span>
        </button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2" style={{fontFamily: 'Manrope, sans-serif', letterSpacing: '-0.02em'}}>{pipeline.name}</h1>
            <p className="text-slate-400" style={{fontFamily: 'Manrope, sans-serif'}}>{pipeline.description}</p>
          </div>
          <button
            onClick={handleExecute}
            disabled={executing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-medium shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200 disabled:opacity-50"
            style={{fontFamily: 'Manrope, sans-serif'}}
            data-testid="execute-pipeline-button"
          >
            {executing ? (
              <><Loader2 size={18} className="animate-spin" /> Executing...</>
            ) : (
              <><Play size={18} /> Execute Now</>
            )}
          </button>
        </div>
      </div>
      
      {/* Pipeline Config */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-[#151923] border border-[#2D3748] rounded-sm p-5">
          <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Status</div>
          <div className="text-2xl font-bold text-white capitalize" style={{fontFamily: 'JetBrains Mono, monospace'}}>{pipeline.status}</div>
        </div>
        <div className="bg-[#151923] border border-[#2D3748] rounded-sm p-5">
          <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Schedule</div>
          <div className="text-lg font-medium text-white" style={{fontFamily: 'JetBrains Mono, monospace'}}>{pipeline.schedule || 'Manual'}</div>
        </div>
        <div className="bg-[#151923] border border-[#2D3748] rounded-sm p-5">
          <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Transformations</div>
          <div className="text-2xl font-bold text-white" style={{fontFamily: 'JetBrains Mono, monospace'}}>{pipeline.transformations?.length || 0}</div>
        </div>
      </div>
      
      {/* Transformations */}
      {pipeline.transformations && pipeline.transformations.length > 0 && (
        <div className="bg-[#151923] border border-[#2D3748] rounded-sm mb-6">
          <div className="border-b border-[#2D3748] p-4 bg-[#1E2330]/50">
            <h2 className="text-lg font-semibold text-white" style={{fontFamily: 'Manrope, sans-serif'}}>Transformation Steps</h2>
          </div>
          <div className="p-4 space-y-3">
            {pipeline.transformations.map((transform, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-[#0B0E14] border border-[#2D3748] rounded-sm">
                <div className="flex items-center justify-center w-6 h-6 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-xs font-bold" style={{fontFamily: 'JetBrains Mono, monospace'}}>{idx + 1}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white capitalize" style={{fontFamily: 'Manrope, sans-serif'}}>{transform.type.replace('_', ' ')}</div>
                  <pre className="text-xs text-slate-400 mt-1" style={{fontFamily: 'JetBrains Mono, monospace'}}>
                    {JSON.stringify(transform, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Execution History */}
      <div className="bg-[#151923] border border-[#2D3748] rounded-sm">
        <div className="border-b border-[#2D3748] p-4 bg-[#1E2330]/50">
          <h2 className="text-lg font-semibold text-white" style={{fontFamily: 'Manrope, sans-serif'}}>Execution History</h2>
          <p className="text-xs text-slate-400 mt-1">Recent pipeline runs</p>
        </div>
        
        {runs.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-[#2D3748]">
            {/* Runs List */}
            <div className="overflow-y-auto max-h-[500px]">
              {runs.map((run) => (
                <div
                  key={run.id}
                  onClick={() => setSelectedRun(run)}
                  className={`p-4 cursor-pointer border-b border-[#2D3748] transition-colors ${
                    selectedRun?.id === run.id ? 'bg-[#1E2330]' : 'hover:bg-[#1E2330]/50'
                  }`}
                  data-testid={`run-item-${run.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <StatusBadge status={run.status} />
                    <span className="text-xs text-slate-500" style={{fontFamily: 'JetBrains Mono, monospace'}}>
                      {format(new Date(run.start_time), 'MMM dd, HH:mm')}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Records</span>
                      <span className="text-slate-300" style={{fontFamily: 'JetBrains Mono, monospace'}}>{run.records_processed}</span>
                    </div>
                    {run.metrics?.overall_quality_score && (
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Quality</span>
                        <span className="text-emerald-400" style={{fontFamily: 'JetBrains Mono, monospace'}}>{run.metrics.overall_quality_score}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Run Details */}
            <div className="lg:col-span-2 p-4">
              {selectedRun ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white" style={{fontFamily: 'Manrope, sans-serif'}}>Execution Details</h3>
                    <StatusBadge status={selectedRun.status} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-[#0B0E14] border border-[#2D3748] rounded-sm p-3">
                      <div className="text-xs text-slate-500 mb-1">Start Time</div>
                      <div className="text-sm text-white" style={{fontFamily: 'JetBrains Mono, monospace'}}>
                        {format(new Date(selectedRun.start_time), 'MMM dd, yyyy HH:mm:ss')}
                      </div>
                    </div>
                    {selectedRun.end_time && (
                      <div className="bg-[#0B0E14] border border-[#2D3748] rounded-sm p-3">
                        <div className="text-xs text-slate-500 mb-1">Duration</div>
                        <div className="text-sm text-white" style={{fontFamily: 'JetBrains Mono, monospace'}}>
                          {Math.round((new Date(selectedRun.end_time) - new Date(selectedRun.start_time)) / 1000)}s
                        </div>
                      </div>
                    )}
                    <div className="bg-[#0B0E14] border border-[#2D3748] rounded-sm p-3">
                      <div className="text-xs text-slate-500 mb-1">Records Processed</div>
                      <div className="text-sm text-white" style={{fontFamily: 'JetBrains Mono, monospace'}}>{selectedRun.records_processed}</div>
                    </div>
                    {selectedRun.metrics?.overall_quality_score && (
                      <div className="bg-[#0B0E14] border border-[#2D3748] rounded-sm p-3">
                        <div className="text-xs text-slate-500 mb-1">Quality Score</div>
                        <div className="text-sm text-emerald-400" style={{fontFamily: 'JetBrains Mono, monospace'}}>{selectedRun.metrics.overall_quality_score}%</div>
                      </div>
                    )}
                  </div>
                  
                  {selectedRun.error_message && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-sm p-4 mb-6">
                      <div className="text-xs text-red-400 uppercase tracking-wide mb-2">Error</div>
                      <div className="text-sm text-red-300" style={{fontFamily: 'JetBrains Mono, monospace'}}>{selectedRun.error_message}</div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3" style={{fontFamily: 'Manrope, sans-serif'}}>Execution Logs</h4>
                    <LogViewer logs={selectedRun.logs} />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  Select a run to view details
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500">
            <Clock size={48} className="mx-auto mb-3 opacity-50" />
            <p>No execution history yet</p>
            <p className="text-sm mt-1">Execute the pipeline to see results</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PipelineDetail;
