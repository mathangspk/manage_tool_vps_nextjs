'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { cchttsApi } from '../../../lib/api';
import { Search, Plus, Edit3, Trash2, Calendar, FileText, Info, Loader2, X } from 'lucide-react';
import moment from 'moment';

export default function CchttPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search filter
  const [searchWo, setSearchWo] = useState('');
  const [searchPct, setSearchPct] = useState('');

  // Modal form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formWo, setFormWo] = useState('');
  const [formPct, setFormPct] = useState('');
  const [formTimeChange, setFormTimeChange] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formError, setFormError] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = {
        wo: searchWo,
        pct: searchPct,
      };
      const response = await cchttsApi.getCchtts(params);
      if (response && response.Data) {
        setItems(response.Data.Row || []);
      }
    } catch (error) {
      console.error('Error fetching CCHTT:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [searchWo, searchPct]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormWo('');
    setFormPct('');
    setFormTimeChange(moment().format('YYYY-MM-DDTHH:mm'));
    setFormNote('');
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormWo(item.WO || '');
    setFormPct(item.PCT || '');
    setFormTimeChange(moment(item.timeChange).format('YYYY-MM-DDTHH:mm'));
    setFormNote(item.note || '');
    setFormError('');
    setModalOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!formWo || !formPct || !formTimeChange) {
      setFormError('Vui lòng điền đầy đủ các trường thông tin bắt buộc (*)');
      return;
    }
    setFormError('');
    setFormSaving(true);

    const payload = {
      WO: formWo,
      PCT: formPct,
      timeChange: new Date(formTimeChange).toISOString(),
      note: formNote,
      userId: editingItem?.userId?._id || user?._id,
    };

    try {
      if (editingItem) {
        await cchttsApi.updateCchtt(editingItem._id, payload);
      } else {
        await cchttsApi.createCchtt(payload);
      }
      setModalOpen(false);
      fetchItems();
    } catch (error) {
      console.error('Error saving CCHTT:', error);
      setFormError(error.response?.data || 'Có lỗi xảy ra khi lưu phiếu');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteItem = async (item) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phiếu Thay đổi CHTT này?')) return;
    try {
      await cchttsApi.deleteCchtt(item._id);
      fetchItems();
    } catch (error) {
      console.error('Error deleting CCHTT:', error);
      alert('Không thể xóa phiếu này');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Thay đổi Chỉ huy trực tiếp (CHTT)</h2>
          <p className="text-xs text-slate-500">Giám sát và ghi nhận thay đổi nhân sự chỉ huy thi công</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md shadow-blue-600/10"
        >
          <Plus className="h-4.5 w-4.5" />
          LẤY SỐ CHTT MỚI
        </button>
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
            Không tìm thấy phiếu thay đổi CHTT nào
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Hành động</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Mã số</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Work Order</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Số PCT</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Người viết</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Thời gian thay đổi</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {items.map(item => {
                  const isAuthor = user?.admin || user?._id === item.userId?._id;
                  return (
                    <tr key={item._id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          {isAuthor && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                className="p-1.5 rounded-lg border border-slate-200 text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title="Sửa"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item)}
                                className="p-1.5 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50 transition-colors"
                                title="Xóa"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">{item.PCCHTT}</td>
                      <td className="px-6 py-4 font-semibold text-blue-600">{item.WO}</td>
                      <td className="px-6 py-4 text-slate-700">{item.PCT}</td>
                      <td className="px-6 py-4 text-slate-600">{item.userId?.name}</td>
                      <td className="px-6 py-4 text-slate-500">
                        {moment(item.timeChange).format('HH:mm DD/MM/YYYY')}
                      </td>
                      <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate" title={item.note}>{item.note}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden animate-scale-in">
            
            <div className="h-14 flex items-center justify-between px-6 border-b border-slate-100 bg-slate-50">
              <h4 className="font-bold text-slate-800 text-sm uppercase">
                {editingItem ? 'Sửa Phiếu Thay Đổi CHTT' : 'Lấy Số CHTT Mới (Tạo Phiếu)'}
              </h4>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-200 text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem}>
              <div className="p-6 space-y-4">
                
                {formError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-xl text-sm font-semibold">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mã Work Order *</label>
                  <input
                    type="text"
                    required
                    value={formWo}
                    onChange={(e) => setFormWo(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Nhập mã WO..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tại PCT *</label>
                  <input
                    type="text"
                    required
                    value={formPct}
                    onChange={(e) => setFormPct(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Nhập mã số PCT..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Thời gian thay đổi *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formTimeChange}
                    onChange={(e) => setFormTimeChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {editingItem && (
                  <div className="text-xs font-semibold text-slate-500">
                    Mã số phiếu: <span className="text-slate-800 font-bold">{editingItem.PCCHTT}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ghi chú</label>
                  <textarea
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Mô tả nội dung thay đổi chỉ huy trực tiếp..."
                  />
                </div>

              </div>

              <div className="h-16 flex items-center justify-end px-6 border-t border-slate-100 bg-slate-50 gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-100"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-md flex items-center gap-2"
                >
                  {formSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'LƯU PHIẾU'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
