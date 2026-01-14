import { useState } from 'react';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { Play, Loader2, Database, Download } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Analytics = () => {
  const [query, setQuery] = useState('-- Select all production data\nSELECT * FROM processed_data LIMIT 100;');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  const sampleQueries = {
    all: '-- Select all production data\nSELECT * FROM processed_data LIMIT 100;',
    groupBy: '-- Aggregate production volume by plant\nGROUP BY plant_id, SUM(production_volume)',
    avgQuality: '-- Average quality score by product\nGROUP BY product, AVG(quality_score)'
  };
  
  const handleExecuteQuery = async () => {
    setLoading(true);
    
    try {
      // Parse query type (simplified for demo)
      let queryType = 'select_all';
      let queryParams = {};
      
      if (query.toLowerCase().includes('group by')) {
        queryType = 'group_by';
        
        // Extract GROUP BY and aggregation info
        if (query.toLowerCase().includes('plant_id')) {
          queryParams = {
            group_field: 'plant_id',
            agg_field: 'production_volume',
            agg_func: 'sum'
          };
        } else if (query.toLowerCase().includes('product')) {
          queryParams = {
            group_field: 'product',
            agg_field: 'quality_score',
            agg_func: 'avg'
          };
        }
      }
      
      const response = await axios.post(`${API}/analytics/query`, {
        type: queryType,
        ...queryParams
      });
      
      setResults(response.data);
      toast.success(`Query executed successfully - ${response.data.row_count} rows returned`);
    } catch (error) {
      console.error('Error executing query:', error);
      toast.error('Query execution failed');
    } finally {
      setLoading(false);
    }
  };
  
  const exportResults = () => {
    if (!results || !results.rows) return;
    
    // Convert to CSV
    const csv = [
      results.columns.join(','),
      ...results.rows.map(row => results.columns.map(col => row[col] || '').join(','))
    ].join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'query_results.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Results exported to CSV');
  };
  
  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2" style={{fontFamily: 'Manrope, sans-serif', letterSpacing: '-0.02em'}}>SQL Analytics</h1>
        <p className="text-slate-400" style={{fontFamily: 'Manrope, sans-serif'}}>Query processed data from pipeline runs</p>
      </div>
      
      {/* Query Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar with sample queries */}
        <div className="bg-[#151923] border border-[#2D3748] rounded-sm p-4">
          <h3 className="text-sm font-semibold text-white mb-3" style={{fontFamily: 'Manrope, sans-serif'}}>Sample Queries</h3>
          <div className="space-y-2">
            <button
              onClick={() => { setQuery(sampleQueries.all); setActiveTab('all'); }}
              className={`w-full text-left px-3 py-2 rounded-sm text-sm transition-all duration-200 ${
                activeTab === 'all' ? 'bg-blue-600 text-white' : 'bg-[#0B0E14] text-slate-300 hover:bg-[#1E2330]'
              }`}
              style={{fontFamily: 'Manrope, sans-serif'}}
              data-testid="query-all-data"
            >
              All Data
            </button>
            <button
              onClick={() => { setQuery(sampleQueries.groupBy); setActiveTab('groupBy'); }}
              className={`w-full text-left px-3 py-2 rounded-sm text-sm transition-all duration-200 ${
                activeTab === 'groupBy' ? 'bg-blue-600 text-white' : 'bg-[#0B0E14] text-slate-300 hover:bg-[#1E2330]'
              }`}
              style={{fontFamily: 'Manrope, sans-serif'}}
              data-testid="query-by-plant"
            >
              By Plant
            </button>
            <button
              onClick={() => { setQuery(sampleQueries.avgQuality); setActiveTab('avgQuality'); }}
              className={`w-full text-left px-3 py-2 rounded-sm text-sm transition-all duration-200 ${
                activeTab === 'avgQuality' ? 'bg-blue-600 text-white' : 'bg-[#0B0E14] text-slate-300 hover:bg-[#1E2330]'
              }`}
              style={{fontFamily: 'Manrope, sans-serif'}}
              data-testid="query-by-product"
            >
              By Product
            </button>
          </div>
          
          <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-sm">
            <div className="flex items-center gap-2 mb-2">
              <Database size={14} className="text-blue-400" />
              <span className="text-xs font-medium text-blue-400" style={{fontFamily: 'Manrope, sans-serif'}}>Available Fields</span>
            </div>
            <div className="text-xs text-slate-400 space-y-1" style={{fontFamily: 'JetBrains Mono, monospace'}}>
              <div>• record_id</div>
              <div>• plant_id</div>
              <div>• product</div>
              <div>• production_volume</div>
              <div>• quality_score</div>
              <div>• downtime_minutes</div>
              <div>• temperature</div>
              <div>• ph_level</div>
              <div>• batch_id</div>
            </div>
          </div>
        </div>
        
        {/* Editor and Results */}
        <div className="lg:col-span-3 space-y-4">
          {/* Editor */}
          <div className="bg-[#151923] border border-[#2D3748] rounded-sm">
            <div className="border-b border-[#2D3748] p-4 bg-[#1E2330]/50 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white" style={{fontFamily: 'Manrope, sans-serif'}}>Query Editor</h2>
              <button
                onClick={handleExecuteQuery}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-medium shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200 disabled:opacity-50"
                style={{fontFamily: 'Manrope, sans-serif'}}
                data-testid="execute-query-button"
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Executing...</>
                ) : (
                  <><Play size={16} /> Execute Query</>
                )}
              </button>
            </div>
            <div className="overflow-hidden" data-testid="sql-editor">
              <Editor
                height="250px"
                defaultLanguage="sql"
                value={query}
                onChange={(value) => setQuery(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: 'JetBrains Mono, monospace',
                  scrollBeyondLastLine: false,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollbar: {
                    vertical: 'visible',
                    horizontal: 'visible'
                  }
                }}
              />
            </div>
          </div>
          
          {/* Results */}
          {results && (
            <div className="bg-[#151923] border border-[#2D3748] rounded-sm">
              <div className="border-b border-[#2D3748] p-4 bg-[#1E2330]/50 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white" style={{fontFamily: 'Manrope, sans-serif'}}>Query Results</h2>
                  <p className="text-xs text-slate-400 mt-1" style={{fontFamily: 'JetBrains Mono, monospace'}}>{results.row_count} rows returned</p>
                </div>
                <button
                  onClick={exportResults}
                  className="flex items-center gap-2 px-3 py-2 bg-[#1E2330] hover:bg-[#2D3748] text-slate-200 border border-[#2D3748] rounded-sm text-sm transition-all duration-200"
                  style={{fontFamily: 'Manrope, sans-serif'}}
                  data-testid="export-results-button"
                >
                  <Download size={14} />
                  Export CSV
                </button>
              </div>
              
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full" data-testid="results-table">
                  <thead className="bg-[#1E2330]/30 sticky top-0">
                    <tr>
                      {results.columns.map((col) => (
                        <th 
                          key={col} 
                          className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide whitespace-nowrap"
                          style={{fontFamily: 'Manrope, sans-serif', letterSpacing: '0.05em'}}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2D3748]">
                    {results.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#1E2330] transition-colors">
                        {results.columns.map((col) => (
                          <td 
                            key={col} 
                            className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap"
                            style={{fontFamily: 'JetBrains Mono, monospace'}}
                          >
                            {typeof row[col] === 'number' ? row[col].toLocaleString() : row[col] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {!results && (
            <div className="bg-[#151923] border border-[#2D3748] rounded-sm p-12 text-center">
              <Database className="mx-auto text-slate-600 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-slate-400 mb-2" style={{fontFamily: 'Manrope, sans-serif'}}>No Results Yet</h3>
              <p className="text-slate-500">Execute a query to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
