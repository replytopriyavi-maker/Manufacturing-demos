import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import axios from "axios";
import Dashboard from "@/pages/Dashboard";
import Pipelines from "@/pages/Pipelines";
import PipelineDetail from "@/pages/PipelineDetail";
import DataQuality from "@/pages/DataQuality";
import Analytics from "@/pages/Analytics";
import DataSources from "@/pages/DataSources";
import { Database, GitBranch, Shield, BarChart3, Server } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Sidebar = () => {
  const location = useLocation();
  
  const menuItems = [
    { path: "/", label: "Dashboard", icon: BarChart3 },
    { path: "/pipelines", label: "Pipelines", icon: GitBranch },
    { path: "/data-quality", label: "Data Quality", icon: Shield },
    { path: "/analytics", label: "SQL Analytics", icon: Database },
    { path: "/data-sources", label: "Data Sources", icon: Server }
  ];
  
  return (
    <div className="w-64 bg-[#151923] border-r border-[#2D3748] h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b border-[#2D3748]">
        <h1 className="text-xl font-bold text-white" style={{fontFamily: 'Manrope, sans-serif', letterSpacing: '-0.02em'}}>Data Pipeline Platform</h1>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wide" style={{fontFamily: 'Manrope, sans-serif', letterSpacing: '0.05em'}}>Coca-Cola Engineering</p>
      </div>
      
      <nav className="flex-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={`flex items-center gap-3 px-4 py-3 rounded-sm mb-2 transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-[0_1px_2px_rgba(0,0,0,0.2)]'
                  : 'text-slate-400 hover:bg-[#1E2330] hover:text-white'
              }`}
              style={{fontFamily: 'Manrope, sans-serif'}}
            >
              <Icon size={18} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-[#2D3748]">
        <div className="text-xs text-slate-500" style={{fontFamily: 'JetBrains Mono, monospace'}}>v1.0.0</div>
      </div>
    </div>
  );
};

function App() {
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    const initializeData = async () => {
      try {
        await axios.post(`${API}/initialize-sample-data`);
        setInitialized(true);
      } catch (e) {
        console.error("Error initializing data:", e);
      }
    };
    
    initializeData();
  }, []);
  
  return (
    <div className="App bg-[#0B0E14] min-h-screen">
      <BrowserRouter>
        <Sidebar />
        <div className="ml-64 min-h-screen">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pipelines" element={<Pipelines />} />
            <Route path="/pipelines/:id" element={<PipelineDetail />} />
            <Route path="/data-quality" element={<DataQuality />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/data-sources" element={<DataSources />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
