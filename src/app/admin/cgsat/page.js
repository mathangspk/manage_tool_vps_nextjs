'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { cgsatsApi } from '../../../lib/api';
import { Search, Info, Loader2 } from 'lucide-react';
import moment from 'moment';

export default function CgsatPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchWo, setSearchWo] = useState('');
  const [searchPct, setSearchPct] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = {
        wo: searchWo,
        pct: searchPct,
      };
      const response = await cgsatsApi.getCgsats(params);
      if (response && response.Data) {
        setItems(response.Data.Row || []);
      }
    } catch (error) {
      console.error('Error fetching CGSAT:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [searchWo, searchPct]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Thay đổi Giám sát an toàn (GSAT)</h2>
          <p className="text-xs text-slate-500">Ghi nhận thay đổi cán bộ giám sát an toàn tại hiện trường</p>
        </div>
      </div>

      {/* Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <input
            type="text"
            value={searchWo}
            onChange={(e) => setSearchWo(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Mã WO..."
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        </div>
        <div className="relative">
          <input
            type="text"
            value={searchPct}
            onChange={(e) => setSearchPct(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Số phiếu PCT..."
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
            <p className="mt-2 text-slate-500 text-sm">Đang tải danh sách...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <Info className="h-10 w-10 mx-auto mb-2" />
            Không tìm thấy phiếu thay đổi GSAT nào
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Mã số</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Work Order</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Số PCT</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Người viết</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Thời gian thay đổi</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {items.map(item => (
                  <tr key={item._id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-slate-800">{item.PCGSAT}</td>
                    <td className="px-6 py-4 font-semibold text-blue-600">{item.WO}</td>
                    <td className="px-6 py-4 text-slate-700">{item.PCT}</td>
                    <td className="px-6 py-4 text-slate-600">{item.userId?.name}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {moment(item.timeChange).format('HH:mm DD/MM/YYYY')}
                    </td>
                    <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate">{item.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
