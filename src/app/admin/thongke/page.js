'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { ordersApi } from '../../../lib/api';
import { 
  BarChart3, RefreshCw, Filter, Search, Loader2,
  TrendingUp, Award, Clock, CheckCircle2, ChevronRight, FileText
} from 'lucide-react';

const DEPARTMENT_LABELS = {
  KN: 'Kiểm Nhiệt',
  TD: 'Tự Động',
  MT: 'Máy Tĩnh',
  MD: 'Máy Động',
  HRSGBOP: 'HRSG-BOP',
  TBP: 'Thiết Bị Phụ',
  TB: 'Turbine'
};

const STATUS_ORDER = [
  'START',
  'READY',
  'IN PROGRESS',
  'INPRG NO TOOL',
  'INPRG HAVE TOOL',
  'COMPLETE',
  'CLOSE'
];

export default function ThongKePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchPct, setSearchPct] = useState('');
  
  // Totals for top cards
  const [totals, setTotals] = useState({
    active: 0,
    ready: 0,
    inProgress: 0,
    completed: 0
  });

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await ordersApi.getDashboardStats({ pct: searchPct });
      if (response && response.Data && response.Data.Row) {
        const rows = response.Data.Row.map(row => {
          let status = row.status;
          if (status === 'IN_PROGRESS') status = 'IN PROGRESS';
          return { ...row, status };
        });
        setStats(rows);

        // Calculate card values
        let active = 0;
        let ready = 0;
        let inProgress = 0;
        let completed = 0;

        rows.forEach(row => {
          const status = row.status;
          const rowTotal = (row.KN || 0) + (row.TD || 0) + (row.MT || 0) + (row.MD || 0) + (row.HRSGBOP || 0) + (row.TBP || 0) + (row.TB || 0);

          if (status === 'START') active += rowTotal;
          else if (status === 'READY') ready += rowTotal;
          else if (status.startsWith('IN') || status === 'IN PROGRESS') inProgress += rowTotal;
          else if (status === 'COMPLETE' || status === 'CLOSE') completed += rowTotal;
        });

        setTotals({ active, ready, inProgress, completed });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [searchPct]);

  // Aggregate totals per department/group
  const getDeptTotal = (deptKey) => {
    return stats.reduce((acc, row) => acc + (row[deptKey] || 0), 0);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'START': return 'Khởi tạo (START)';
      case 'READY': return 'Sẵn sàng (READY)';
      case 'IN PROGRESS': return 'Đang thực hiện (IN PROGRESS)';
      case 'INPRG NO TOOL': return 'Chưa mượn dụng cụ';
      case 'INPRG HAVE TOOL': return 'Đang mượn dụng cụ';
      case 'COMPLETE': return 'Hoàn thành (COMPLETE)';
      case 'CLOSE': return 'Đã đóng (CLOSE)';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    if (status === 'START') return 'text-sky-600 bg-sky-50 border-sky-100';
    if (status === 'READY') return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (status === 'IN PROGRESS') return 'text-amber-600 bg-amber-50 border-amber-100';
    if (status.startsWith('INPRG')) return 'text-orange-600 bg-orange-50 border-orange-100';
    if (status === 'COMPLETE') return 'text-teal-600 bg-teal-50 border-teal-100';
    return 'text-slate-600 bg-slate-100 border-slate-200';
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Báo cáo Thống kê & Giám sát</h2>
          <p className="text-xs text-slate-500">Giám sát số lượng phiếu công tác thực tế của từng phân xưởng và tổ bảo trì</p>
        </div>
        <button
          onClick={fetchStats}
          className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all"
          title="Tải lại dữ liệu"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl border border-slate-800 text-white space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phiếu Khởi tạo (START)</span>
            <TrendingUp className="h-5 w-5 text-sky-400" />
          </div>
          <p className="text-3xl font-extrabold">{totals.active}</p>
          <p className="text-xs text-slate-400">Phiếu đang xếp lịch bảo trì</p>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl border border-slate-800 text-white space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sẵn Sàng (READY)</span>
            <Clock className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold">{totals.ready}</p>
          <p className="text-xs text-slate-400">Phiếu đã chuẩn bị xong dụng cụ</p>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl border border-slate-800 text-white space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đang Thi Công (IN PROGRESS)</span>
            <Award className="h-5 w-5 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold">{totals.inProgress}</p>
          <p className="text-xs text-slate-400">Các công việc đang chạy ngoài hiện trường</p>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl border border-slate-800 text-white space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hoàn Thành & Đóng</span>
            <CheckCircle2 className="h-5 w-5 text-teal-400" />
          </div>
          <p className="text-3xl font-extrabold">{totals.completed}</p>
          <p className="text-xs text-slate-400">Cơ số công tác đã nghiệm thu và hoàn trả</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <Filter className="h-4 w-4 text-slate-400 flex-shrink-0" />
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={searchPct}
            onChange={(e) => setSearchPct(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            placeholder="Lọc theo PCT (Ví dụ: 2026)..."
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        </div>
      </div>

      {/* Grid: Charts & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Visual Department Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 lg:col-span-1">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Biểu đồ phân bố công việc
          </h3>
          <p className="text-xs text-slate-400">Tỷ lệ khối lượng công việc hiện hành theo tổ chuyên môn</p>

          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {Object.entries(DEPARTMENT_LABELS).map(([key, label]) => {
                const total = getDeptTotal(key);
                const maxVal = Math.max(...Object.keys(DEPARTMENT_LABELS).map(k => getDeptTotal(k)), 1);
                const percent = Math.round((total / maxVal) * 100);

                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">{label}</span>
                      <span className="text-slate-900 font-bold">{total} phiếu</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Detailed Status Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-2 space-y-4 p-6">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Bảng thống kê chi tiết theo Tổ & Phân xưởng
          </h3>

          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
            </div>
          ) : stats.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-sm">
              Không có dữ liệu thống kê
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Trạng thái</th>
                    {Object.values(DEPARTMENT_LABELS).map(label => (
                      <th key={label} className="px-3 py-3 text-center">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {STATUS_ORDER.map(statusKey => {
                    const row = stats.find(r => r.status === statusKey) || {
                      status: statusKey,
                      KN: 0, TD: 0, MT: 0, MD: 0, HRSGBOP: 0, TBP: 0, TB: 0
                    };

                    return (
                      <tr key={statusKey} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-800">
                          <span className={`inline-block px-2 py-0.5 rounded-md border text-xs font-semibold ${getStatusColor(statusKey)}`}>
                            {getStatusLabel(statusKey)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-slate-700">{row.KN || 0}</td>
                        <td className="px-3 py-3 text-center font-bold text-slate-700">{row.TD || 0}</td>
                        <td className="px-3 py-3 text-center font-bold text-slate-700">{row.MT || 0}</td>
                        <td className="px-3 py-3 text-center font-bold text-slate-700">{row.MD || 0}</td>
                        <td className="px-3 py-3 text-center font-bold text-slate-700">{row.HRSGBOP || 0}</td>
                        <td className="px-3 py-3 text-center font-bold text-slate-700">{row.TBP || 0}</td>
                        <td className="px-3 py-3 text-center font-bold text-slate-700">{row.TB || 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
