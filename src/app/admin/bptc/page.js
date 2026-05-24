'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { bptcsApi, authApi } from '../../../lib/api';
import { useRouter } from 'next/navigation';
import { 
  Search, Plus, Edit3, Trash2, Eye, Calendar, 
  User as UserIcon, Loader2, Info, X
} from 'lucide-react';
import moment from 'moment';

export default function BptcsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [bptcs, setBptcs] = useState([]);
  const [totalBptcs, setTotalBptcs] = useState(0);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search parameters
  const [searchBptc, setSearchBptc] = useState('');
  const [searchJsa, setSearchJsa] = useState('');
  const [searchContent, setSearchContent] = useState('');
  const [searchUser, setSearchUser] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Modal form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBptc, setEditingBptc] = useState(null);
  const [formContent, setFormContent] = useState('');
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

  const fetchBptcs = async () => {
    setLoading(true);
    try {
      const params = {
        bptc: searchBptc,
        jsa: searchJsa,
        content: searchContent,
        userId: searchUser,
        skip: (page - 1) * limit,
        limit: limit,
      };
      const response = await bptcsApi.getBptcs(params);
      if (response && response.Data) {
        setBptcs(response.Data.Row || []);
        setTotalBptcs(response.Data.Total || 0);
      }
    } catch (error) {
      console.error('Error fetching BPTCs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchBptcs();
  }, [searchBptc, searchJsa, searchContent, searchUser, page, limit]);

  const handleOpenAddModal = () => {
    setEditingBptc(null);
    setFormContent('');
    setFormNote('');
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (bptc) => {
    setEditingBptc(bptc);
    setFormContent(bptc.content || '');
    setFormNote(bptc.note || '');
    setFormError('');
    setModalOpen(true);
  };

  const handleSaveBptc = async (e) => {
    e.preventDefault();
    if (!formContent) {
      setFormError('Vui lòng điền đầy đủ nội dung công tác');
      return;
    }
    setFormError('');
    setFormSaving(true);

    const bptcData = {
      content: formContent,
      note: formNote,
      userId: user._id,
      group: user.group,
    };

    try {
      if (editingBptc) {
        bptcData.userId = editingBptc.userId?._id || user._id;
        await bptcsApi.updateBptc(editingBptc._id, bptcData);
      } else {
        await bptcsApi.createBptc(bptcData);
      }
      setModalOpen(false);
      fetchBptcs();
    } catch (error) {
      setFormError(error.response?.data || 'Có lỗi xảy ra khi lưu BPTC & JSA');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteBptc = async (bptc) => {
    if (!confirm('Bạn có chắc chắn muốn xóa BPTC & JSA này?')) return;
    try {
      await bptcsApi.deleteBptc(bptc._id);
      fetchBptcs();
    } catch (error) {
      alert('Không thể xóa BPTC & JSA này');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Biện pháp thi công (BPTC) & Phân tích an toàn công việc (JSA)</h2>
          <p className="text-xs text-slate-500">Đăng ký và duyệt mã số biện pháp kỹ thuật và phân tích an toàn</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md shadow-blue-600/10"
        >
          <Plus className="h-4.5 w-4.5" />
          ĐĂNG KÝ BPTC & JSA
        </button>
      </div>

      {/* Filter Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Số Biện pháp</label>
          <div className="relative">
            <input
              type="text"
              value={searchBptc}
              onChange={(e) => setSearchBptc(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              placeholder="Số BPTC..."
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Số JSA</label>
          <div className="relative">
            <input
              type="text"
              value={searchJsa}
              onChange={(e) => setSearchJsa(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              placeholder="Số JSA..."
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
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Người lấy số</label>
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
      </div>

      {/* Main Table / Mobile Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
            <p className="mt-4 text-slate-500 text-sm">Đang tải danh sách BPTC & JSA...</p>
          </div>
        ) : bptcs.length === 0 ? (
          <div className="py-24 text-center text-slate-400">
            <Info className="h-12 w-12 mx-auto mb-3" />
            Không tìm thấy BPTC & JSA nào
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Hành động</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Số Biện Pháp Thi Công</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Số JSA</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Nhóm kiểm định</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Nội dung công tác</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Người lấy số</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Nhà máy / Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {bptcs.map(bptc => {
                    const isAuthor = user?.admin || user?._id === bptc.userId?._id;
                    return (
                      <tr key={bptc._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => router.push(`/admin/bptc/${bptc._id}`)}
                              className="p-1.5 rounded-lg border border-slate-200 text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Chi tiết"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {isAuthor && (
                              <>
                                <button
                                  onClick={() => handleOpenEditModal(bptc)}
                                  className="p-1.5 rounded-lg border border-slate-200 text-emerald-600 hover:bg-emerald-50 transition-colors"
                                  title="Sửa"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteBptc(bptc)}
                                  className="p-1.5 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50 transition-colors"
                                  title="Xóa"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800 text-sm whitespace-nowrap">{bptc.BPTC}</td>
                        <td className="px-6 py-4 font-semibold text-slate-700 text-sm whitespace-nowrap">{bptc.JSA}</td>
                        <td className="px-6 py-4 text-slate-700 text-sm whitespace-nowrap">{bptc.userId?.department || 'Kỹ thuật'}</td>
                        <td className="px-6 py-4 text-slate-600 text-sm truncate max-w-[300px]" title={bptc.content}>{bptc.content}</td>
                        <td className="px-6 py-4 text-slate-700 text-sm whitespace-nowrap">{bptc.userId?.name}</td>
                        <td className="px-6 py-4 text-slate-500 text-sm whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-800">
                            {bptc.note || 'Cà Mau'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards */}
            <div className="block lg:hidden divide-y divide-slate-100">
              {bptcs.map(bptc => {
                const isAuthor = user?.admin || user?._id === bptc.userId?._id;
                return (
                  <div key={bptc._id} className="p-5 hover:bg-slate-50/70 transition-colors space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">JSA: {bptc.JSA}</span>
                        <h4 className="font-bold text-slate-800 text-sm">Số BPTC: {bptc.BPTC}</h4>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800">
                        {bptc.note || 'Cà Mau'}
                      </span>
                    </div>

                    <p className="text-slate-600 text-sm line-clamp-2">{bptc.content}</p>

                    <div className="flex justify-between items-center text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">
                      <div className="flex items-center gap-1.5"><UserIcon className="h-4 w-4" /> {bptc.userId?.name}</div>
                      <div>{bptc.userId?.department || 'Kỹ thuật'}</div>
                    </div>

                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        onClick={() => router.push(`/admin/bptc/${bptc._id}`)}
                        className="flex items-center gap-1 py-1.5 px-3 rounded-lg border border-slate-200 text-blue-600 hover:bg-blue-50 text-xs font-semibold"
                      >
                        <Eye className="h-3.5 w-3.5" /> Xem chi tiết
                      </button>
                      {isAuthor && (
                        <>
                          <button
                            onClick={() => handleOpenEditModal(bptc)}
                            className="flex items-center gap-1 py-1.5 px-3 rounded-lg border border-slate-200 text-emerald-600 hover:bg-emerald-50 text-xs font-semibold"
                          >
                            <Edit3 className="h-3.5 w-3.5" /> Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteBptc(bptc)}
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
                Tổng số: <span className="font-bold text-slate-700">{totalBptcs}</span> bản ghi
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
                  disabled={page * limit >= totalBptcs}
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
                {editingBptc ? 'Sửa BPTC & JSA' : 'Đăng ký BPTC & JSA mới'}
              </h4>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-200 text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBptc}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {formError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-xl text-sm font-semibold">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nội dung công tác *</label>
                  <textarea
                    required
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    rows={4}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Mô tả nội dung công việc cần biện pháp kỹ thuật..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nhà máy / Ghi chú</label>
                  <select
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Chọn nhà máy...</option>
                    <option value="Cà Mau 1">Cà Mau 1</option>
                    <option value="Cà Mau 2">Cà Mau 2</option>
                  </select>
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
