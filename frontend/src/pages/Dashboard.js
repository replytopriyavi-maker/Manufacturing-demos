import { useEffect, useState } from 'react';
import axios from 'axios';
import { Activity, Database, GitBranch, TrendingUp, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MetricCard = ({ title, value, icon: Icon, trend, color = 'blue' }) => {
  const colorClasses = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    green: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    teal: 'text-teal-400 bg-teal-500/10 border-teal-500/20'
  };
  
  return (
    <div className="bg-[#151923] border border-[#2D3748] rounded-sm p-4" data-testid={`metric-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wide mb-1" style={{fontFamily: 'Manrope, sans-serif', letterSpacing: '0.05em'}}>{title}</div>
          <div className="text-3xl font-bold text-white" style={{fontFamily: 'JetBrains Mono, monospace'}}>{value}</div>
        </div>
        <div className={`p-2 rounded border ${colorClasses[color]}`}>
          <Icon size={20} />
        </div>
      </div>
      {trend && <div className="text-xs text-slate-500" style={{fontFamily: 'JetBrains Mono, monospace'}}>{trend}</div>}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const statusConfig = {
    success: { label: 'SUCCESS', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    failed: { label: 'FAILED', class: 'bg-red-500/10 text-red-400 border-red-500/20' },
    running: { label: 'RUNNING', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse' }
  };
  
  const config = statusConfig[status] || statusConfig.success;
  
  return (
    <span 
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.class}`}
      style={{fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em'}}
      data-testid={`status-badge-${status}`}
    >
      {config.label}
    </span>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchDashboardStats();
    const interval = setInterval(fetchDashboardStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);
  
  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
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
  
  if (!stats) return null;
  
  // Prepare quality trend data for chart
  const qualityTrendData = stats.quality_trend.map(item => ({
    timestamp: format(new Date(item.timestamp), 'HH:mm'),
    score: item.quality_score
  })).reverse();
  
  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2" style={{fontFamily: 'Manrope, sans-serif', letterSpacing: '-0.02em'}}>Pipeline Dashboard</h1>
        <p className="text-slate-400" style={{fontFamily: 'Manrope, sans-serif'}}>Real-time monitoring and analytics for data pipelines</p>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard 
          title="Active Pipelines" 
          value={stats.active_pipelines} 
          icon={GitBranch} 
          trend={`${stats.total_pipelines} total`}
          color="blue"
        />
        <MetricCard 
          title="Successful Runs" 
          value={stats.run_stats.success} 
          icon={CheckCircle2} 
          trend="Last 10 executions"
          color="green"
        />
        <MetricCard 
          title="Failed Runs" 
          value={stats.run_stats.failed} 
          icon={XCircle} 
          trend="Requires attention"
          color="red"
        />
        <MetricCard 
          title="Avg Quality Score" 
          value={`${stats.avg_quality_score}%`} 
          icon={TrendingUp} 
          trend="Last 50 runs"
          color="teal"
        />
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quality Trend Chart */}
        <div className="lg:col-span-2 bg-[#151923] border border-[#2D3748] rounded-sm">
          <div className="border-b border-[#2D3748] p-4 bg-[#1E2330]/50">
            <h2 className="text-lg font-semibold text-white" style={{fontFamily: 'Manrope, sans-serif'}}>Data Quality Trend</h2>
            <p className="text-xs text-slate-400 mt-1">Quality scores over recent pipeline runs</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={qualityTrendData}>
                <defs>
                  <linearGradient id="qualityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0}/>
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
                  stroke="#14B8A6" 
                  strokeWidth={2}
                  fill="url(#qualityGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="bg-[#151923] border border-[#2D3748] rounded-sm">
          <div className="border-b border-[#2D3748] p-4 bg-[#1E2330]/50">
            <h2 className="text-lg font-semibold text-white" style={{fontFamily: 'Manrope, sans-serif'}}>System Overview</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-slate-400" />
                <span className="text-sm text-slate-300">Data Sources</span>
              </div>
              <span className="text-lg font-bold text-white" style={{fontFamily: 'JetBrains Mono, monospace'}}>{stats.total_sources}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-slate-400" />
                <span className="text-sm text-slate-300">Running Now</span>
              </div>
              <span className="text-lg font-bold text-white" style={{fontFamily: 'JetBrains Mono, monospace'}}>{stats.run_stats.running}</span>
            </div>
            <div className="border-t border-[#2D3748] pt-4 mt-4">
              <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">System Health</div>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 bg-[#1E2330] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{width: `${stats.avg_quality_score}%`}}
                  />
                </div>
                <span className="text-xs font-medium text-emerald-400" style={{fontFamily: 'JetBrains Mono, monospace'}}>{stats.avg_quality_score}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Pipeline Runs */}
      <div className="mt-6 bg-[#151923] border border-[#2D3748] rounded-sm">
        <div className="border-b border-[#2D3748] p-4 bg-[#1E2330]/50">
          <h2 className="text-lg font-semibold text-white" style={{fontFamily: 'Manrope, sans-serif'}}>Recent Pipeline Runs</h2>
          <p className="text-xs text-slate-400 mt-1">Latest execution history</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="recent-runs-table">
            <thead className="bg-[#1E2330]/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide" style={{fontFamily: 'Manrope, sans-serif', letterSpacing: '0.05em'}}>Pipeline</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide" style={{fontFamily: 'Manrope, sans-serif', letterSpacing: '0.05em'}}>Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide" style={{fontFamily: 'Manrope, sans-serif', letterSpacing: '0.05em'}}>Records</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide" style={{fontFamily: 'Manrope, sans-serif', letterSpacing: '0.05em'}}>Quality</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide" style={{fontFamily: 'Manrope, sans-serif', letterSpacing: '0.05em'}}>Start Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D3748]">
              {stats.recent_runs.map((run) => (
                <tr key={run.id} className="hover:bg-[#1E2330] transition-colors" data-testid={`run-row-${run.id}`}>
                  <td className="px-4 py-3 text-sm text-slate-200" style={{fontFamily: 'Manrope, sans-serif'}}>{run.pipeline_name}</td>
                  <td className="px-4 py-3"><StatusBadge status={run.status} /></td>
                  <td className="px-4 py-3 text-sm text-slate-300" style={{fontFamily: 'JetBrains Mono, monospace'}}>{run.records_processed.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-slate-300" style={{fontFamily: 'JetBrains Mono, monospace'}}>
                    {run.metrics?.overall_quality_score ? `${run.metrics.overall_quality_score}%` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400" style={{fontFamily: 'JetBrains Mono, monospace'}}>
                    {format(new Date(run.start_time), 'MMM dd, HH:mm:ss')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
