'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { bbdgktsApi, authApi } from '../../../lib/api';
import { useRouter } from 'next/navigation';
import { 
  Search, Plus, Edit3, Trash2, Eye, Calendar, 
  User as UserIcon, Loader2, Info, X
} from 'lucide-react';
import moment from 'moment';

export default function BbdgktsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [bbdgkts, setBbdgkts] = useState([]);
  const [totalBbdgkts, setTotalBbdgkts] = useState(0);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search parameters
  const [searchBbdgkt, setSearchBbdgkt] = useState('');
  const [searchWo, setSearchWo] = useState('');
  const [searchContent, setSearchContent] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [searchStatus, setSearchStatus] = useState('ALL');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Modal form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBbdgkt, setEditingBbdgkt] = useState(null);
  const [formWo, setFormWo] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formError, setFormError] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await authApi.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchBbdgkts = async () => {
    setLoading(true);
    try {
      const params = {
        bbdgkt: searchBbdgkt,
        wo: searchWo,
        content: searchContent,
        userId: searchUser,
        status: searchStatus,
        skip: (page - 1) * limit,
        limit: limit,
      };
      const response = await bbdgktsApi.getBbdgkts(params);
      if (response && response.Data) {
        setBbdgkts(response.Data.Row || []);
        setTotalBbdgkts(response.Data.Total || 0);
      }
    } catch (error) {
      console.error('Error fetching BBDGKTs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchBbdgkts();
  }, [searchBbdgkt, searchWo, searchContent, searchUser, searchStatus, page, limit]);

  const handleOpenAddModal = () => {
    setEditingBbdgkt(null);
    setFormWo('');
    setFormContent('');
    setFormTime(moment().format('YYYY-MM-DD'));
    setFormNote('');
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (bbdgkt) => {
    setEditingBbdgkt(bbdgkt);
    setFormWo(bbdgkt.WO || '');
    setFormContent(bbdgkt.content || '');
    setFormTime(moment(bbdgkt.time).format('YYYY-MM-DD'));
    setFormNote(bbdgkt.note || '');
    setFormError('');
    setModalOpen(true);
  };

  const handleSaveBbdgkt = async (e) => {
    e.preventDefault();
    if (!formWo || !formContent || !formTime) {
      setFormError('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }
    setFormError('');
    setFormSaving(true);

    const bbdgktData = {
      WO: formWo,
      content: formContent,
      time: new Date(formTime).toISOString(),
      note: formNote,
      userId: user._id,
      group: user.group,
    };

    try {
      if (editingBbdgkt) {
        // Keep the original author's userId when updated
        bbdgktData.userId = editingBbdgkt.userId?._id || user._id;
        await bbdgktsApi.updateBbdgkt(editingBbdgkt._id, bbdgktData);
      } else {
        await bbdgktsApi.createBbdgkt(bbdgktData);
      }
      setModalOpen(false);
      fetchBbdgkts();
    } catch (error) {
      setFormError(error.response?.data || 'Có lỗi xảy ra khi lưu Biên bản ĐGKT');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteBbdgkt = async (bbdgkt) => {
    if (!confirm('Bạn có chắc chắn muốn xóa Biên bản ĐGKT này?')) return;
    try {
      await bbdgktsApi.deleteBbdgkt(bbdgkt._id);
      fetchBbdgkts();
    } catch (error) {
      alert('Không thể xóa Biên bản ĐGKT này');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Danh sách Biên bản Đánh giá Kỹ thuật (ĐGKT)</h2>
          <p className="text-xs text-slate-500">Quản lý và tra cứu biên bản đánh giá thiết bị sau khi bảo trì</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md shadow-blue-600/10"
        >
          <Plus className="h-4.5 w-4.5" />
          THÊM BIÊN BẢN
        </button>
      </div>

      {/* Filter Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Số Biên bản</label>
          <div className="relative">
            <input
              type="text"
              value={searchBbdgkt}
              onChange={(e) => setSearchBbdgkt(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              placeholder="Số biên bản..."
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Work Order</label>
          <div className="relative">
            <input
              type="text"
              value={searchWo}
              onChange={(e) => setSearchWo(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              placeholder="Mã WO..."
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Nội dung công tác</label>
          <div className="relative">
            <input
              type="text"
              value={searchContent}
              onChange={(e) => setSearchContent(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              placeholder="Tìm nội dung..."
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Người thực hiện</label>
          <select
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          >
            <option value="">Tất cả cán bộ</option>
            {users.map(u => (
              <option key={u._id} value={u._id}>{u.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Trạng thái thiết bị</label>
          <select
            value={searchStatus}
            onChange={(e) => setSearchStatus(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          >
            <option value="ALL">Tất cả</option>
            <option value="START">START</option>
            <option value="READY">READY</option>
            <option value="IN PROGRESS">IN PROGRESS</option>
            <option value="COMPLETE">COMPLETE</option>
            <option value="CLOSE">CLOSE</option>
          </select>
        </div>
      </div>

      {/* Main Table / Mobile Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
            <p className="mt-4 text-slate-500 text-sm">Đang tải danh sách Biên bản ĐGKT...</p>
          </div>
        ) : bbdgkts.length === 0 ? (
          <div className="py-24 text-center text-slate-400">
            <Info className="h-12 w-12 mx-auto mb-3" />
            Không tìm thấy Biên bản ĐGKT nào
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Hành động</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Số Biên Bản ĐGKT</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Phân xưởng</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Nội dung công tác</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Ngày thực hiện</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Work Order</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Người thực hiện</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {bbdgkts.map(bbdgkt => {
                    const isAuthor = user?.admin || user?._id === bbdgkt.userId?._id;
                    return (
                      <tr key={bbdgkt._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => router.push(`/admin/bbdgkt/${bbdgkt._id}`)}
                              className="p-1.5 rounded-lg border border-slate-200 text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Chi tiết"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {isAuthor && (
                              <>
                                <button
                                  onClick={() => handleOpenEditModal(bbdgkt)}
                                  className="p-1.5 rounded-lg border border-slate-200 text-emerald-600 hover:bg-emerald-50 transition-colors"
                                  title="Sửa"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteBbdgkt(bbdgkt)}
                                  className="p-1.5 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50 transition-colors"
                                  title="Xóa"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800 text-sm whitespace-nowrap">{bbdgkt.BBDGKT}</td>
                        <td className="px-6 py-4 text-slate-700 text-sm whitespace-nowrap">{bbdgkt.userId?.department || 'Kỹ thuật'}</td>
                        <td className="px-6 py-4 text-slate-600 text-sm truncate max-w-[250px]" title={bbdgkt.content}>{bbdgkt.content}</td>
                        <td className="px-6 py-4 text-slate-500 text-sm whitespace-nowrap">
                          {moment(bbdgkt.time).format('DD/MM/YYYY')}
                        </td>
                        <td className="px-6 py-4 font-semibold text-blue-600 text-sm whitespace-nowrap">{bbdgkt.WO}</td>
                        <td className="px-6 py-4 text-slate-700 text-sm whitespace-nowrap">{bbdgkt.userId?.name}</td>
                        <td className="px-6 py-4 text-slate-500 text-sm truncate max-w-[150px]">{bbdgkt.note}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards */}
            <div className="block lg:hidden divide-y divide-slate-100">
              {bbdgkts.map(bbdgkt => {
                const isAuthor = user?.admin || user?._id === bbdgkt.userId?._id;
                return (
                  <div key={bbdgkt._id} className="p-5 hover:bg-slate-50/70 transition-colors space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">WO: {bbdgkt.WO}</span>
                        <h4 className="font-bold text-slate-800 text-sm">Số ĐGKT: {bbdgkt.BBDGKT}</h4>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800">
                        {bbdgkt.userId?.department || 'Kỹ thuật'}
                      </span>
                    </div>

                    <p className="text-slate-600 text-sm line-clamp-2">{bbdgkt.content}</p>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">
                      <div className="flex items-center gap-1.5"><UserIcon className="h-4 w-4" /> {bbdgkt.userId?.name}</div>
                      <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {moment(bbdgkt.time).format('DD/MM/YYYY')}</div>
                    </div>

                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        onClick={() => router.push(`/admin/bbdgkt/${bbdgkt._id}`)}
                        className="flex items-center gap-1 py-1.5 px-3 rounded-lg border border-slate-200 text-blue-600 hover:bg-blue-50 text-xs font-semibold"
                      >
                        <Eye className="h-3.5 w-3.5" /> Xem chi tiết
                      </button>
                      {isAuthor && (
                        <>
                          <button
                            onClick={() => handleOpenEditModal(bbdgkt)}
                            className="flex items-center gap-1 py-1.5 px-3 rounded-lg border border-slate-200 text-emerald-600 hover:bg-emerald-50 text-xs font-semibold"
                          >
                            <Edit3 className="h-3.5 w-3.5" /> Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteBbdgkt(bbdgkt)}
                            className="flex items-center gap-1 py-1.5 px-3 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50 text-xs font-semibold"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Xóa
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="h-16 flex items-center justify-between px-6 border-t border-slate-100 bg-slate-50 text-slate-500 text-sm">
              <div>
                Tổng số: <span className="font-bold text-slate-700">{totalBbdgkts}</span> bản ghi
              </div>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-100 rounded-lg disabled:opacity-50 text-xs font-semibold"
                >
                  TRƯỚC
                </button>
                <span className="flex items-center px-3 text-xs font-bold text-slate-700">Trang {page}</span>
                <button
                  disabled={page * limit >= totalBbdgkts}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-100 rounded-lg disabled:opacity-50 text-xs font-semibold"
                >
                  TIẾP
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden animate-scale-in">
            
            <div className="h-14 flex items-center justify-between px-6 border-b border-slate-100 bg-slate-50">
              <h4 className="font-bold text-slate-800 text-sm uppercase">
                {editingBbdgkt ? 'Sửa Biên bản ĐGKT' : 'Tạo Biên bản ĐGKT mới'}
              </h4>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-200 text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBbdgkt}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
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
                    placeholder="Mã WO..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nội dung công tác *</label>
                  <textarea
                    required
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Mô tả nội dung kiểm định bảo trì..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ngày thực hiện *</label>
                  <input
                    type="date"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ghi chú</label>
                  <input
                    type="text"
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Ghi chú thêm nếu có..."
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
                  {formSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'LƯU DỮ LIỆU'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
