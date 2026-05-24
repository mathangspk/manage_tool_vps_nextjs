'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { fastReportsApi, authApi } from '../../../lib/api';
import { useRouter } from 'next/navigation';
import { 
  Search, Plus, Edit3, Trash2, Eye, Calendar, 
  User as UserIcon, Loader2, Info, X, MapPin, Tag
} from 'lucide-react';
import moment from 'moment';

export default function FastReportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [totalReports, setTotalReports] = useState(0);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search parameters
  const [searchWo, setSearchWo] = useState('');
  const [searchContent, setSearchContent] = useState('');
  const [searchKks, setSearchKks] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [searchStatus, setSearchStatus] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Modal form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [formWo, setFormWo] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formKks, setFormKks] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formError, setFormError] = useState('');
  const [formResult, setFormResult] = useState('');
  const [formEmploy, setFormEmploy] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formTimeStart, setFormTimeStart] = useState('');
  const [formTimeStop, setFormTimeStop] = useState('');
  const [validationError, setValidationError] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await authApi.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = {
        wo: searchWo,
        content: searchContent,
        kks: searchKks,
        userId: searchUser,
        status: searchStatus,
        dateFrom: dateFrom ? moment(dateFrom).format('DD/MM/YYYY') : '',
        dateTo: dateTo ? moment(dateTo).format('DD/MM/YYYY') : '',
        skip: (page - 1) * limit,
        limit: limit,
      };
      const response = await fastReportsApi.getReports(params);
      if (response && response.Data) {
        setReports(response.Data.Row || []);
        setTotalReports(response.Data.Total || 0);
      }
    } catch (error) {
      console.error('Error fetching Fast Reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [searchWo, searchContent, searchKks, searchUser, searchStatus, dateFrom, dateTo, page, limit]);

  const handleOpenAddModal = () => {
    setEditingReport(null);
    setFormWo('');
    setFormLocation('');
    setFormKks('');
    setFormContent('');
    setFormError('');
    setFormResult('');
    setFormEmploy('');
    setFormTime('');
    setFormTimeStart(moment().format('YYYY-MM-DD'));
    setFormTimeStop(moment().add(1, 'days').format('YYYY-MM-DD'));
    setValidationError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (report) => {
    setEditingReport(report);
    setFormWo(report.WO || '');
    setFormLocation(report.location || '');
    setFormKks(report.KKS || '');
    setFormContent(report.content || '');
    setFormError(report.error || '');
    setFormResult(report.result || '');
    setFormEmploy(report.employ || '');
    setFormTime(report.time || '');
    setFormTimeStart(moment(report.timeStart).format('YYYY-MM-DD'));
    setFormTimeStop(moment(report.timeStop).format('YYYY-MM-DD'));
    setValidationError('');
    setModalOpen(true);
  };

  const handleSaveReport = async (e) => {
    e.preventDefault();
    if (!formWo || !formLocation || !formContent || !formError) {
      setValidationError('Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
      return;
    }
    setValidationError('');
    setFormSaving(true);

    const reportData = {
      WO: formWo,
      location: formLocation,
      KKS: formKks,
      content: formContent,
      error: formError,
      result: formResult,
      employ: formEmploy,
      time: formTime,
      timeStart: new Date(formTimeStart).toISOString(),
      timeStop: new Date(formTimeStop).toISOString(),
      userId: user._id,
      status: editingReport?.status || 'START',
      statusTool: editingReport?.statusTool || 'START',
      toolId: editingReport?.toolId || [],
      images: editingReport?.images || [],
    };

    try {
      if (editingReport) {
        reportData.userId = editingReport.userId?._id || user._id;
        await fastReportsApi.updateReport(editingReport._id, reportData);
      } else {
        await fastReportsApi.createReport(reportData);
      }
      setModalOpen(false);
      fetchReports();
    } catch (error) {
      setValidationError(error.response?.data || 'Có lỗi xảy ra khi lưu Báo cáo nhanh');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteReport = async (report) => {
    if (!confirm('Bạn có chắc chắn muốn xóa Báo cáo nhanh này?')) return;
    try {
      await fastReportsApi.deleteReport(report._id);
      fetchReports();
    } catch (error) {
      alert('Không thể xóa báo cáo này');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Báo cáo nhanh kỹ thuật & an toàn (Fast Report)</h2>
          <p className="text-xs text-slate-500">Báo cáo sự cố thiết bị nhanh, phương án xử lý và đính kèm hình ảnh</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md shadow-blue-600/10"
        >
          <Plus className="h-4.5 w-4.5" />
          TẠO BÁO CÁO NHANH
        </button>
      </div>

      {/* Filter Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
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
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Nội dung</label>
          <div className="relative">
            <input
              type="text"
              value={searchContent}
              onChange={(e) => setSearchContent(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              placeholder="Nội dung..."
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">KKS</label>
          <div className="relative">
            <input
              type="text"
              value={searchKks}
              onChange={(e) => setSearchKks(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              placeholder="Mã KKS..."
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Tạo bởi</label>
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
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Trạng thái</label>
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

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Từ ngày</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Đến ngày</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Main Table / Mobile Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
            <p className="mt-4 text-slate-500 text-sm">Đang tải danh sách Fast Report...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="py-24 text-center text-slate-400">
            <Info className="h-12 w-12 mx-auto mb-3" />
            Không tìm thấy Báo cáo nhanh nào
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden xl:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Hành động</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Work Order</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Tạo bởi</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Địa điểm</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Hệ thống/KKS</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Nội dung công tác</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Ngày bắt đầu</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Ngày kết thúc</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Phân xưởng</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {reports.map(report => {
                    const isAuthor = user?.admin || user?._id === report.userId?._id;
                    return (
                      <tr key={report._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => router.push(`/admin/fastReport/${report._id}`)}
                              className="p-1.5 rounded-lg border border-slate-200 text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Chi tiết"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {isAuthor && (
                              <>
                                <button
                                  onClick={() => handleOpenEditModal(report)}
                                  className="p-1.5 rounded-lg border border-slate-200 text-emerald-600 hover:bg-emerald-50 transition-colors"
                                  title="Sửa"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                {user?.vip && (
                                  <button
                                    onClick={() => handleDeleteReport(report)}
                                    className="p-1.5 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50 transition-colors"
                                    title="Xóa"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800 text-sm whitespace-nowrap">{report.WO}</td>
                        <td className="px-6 py-4 text-slate-700 text-sm whitespace-nowrap">{report.userId?.name}</td>
                        <td className="px-6 py-4 text-slate-600 text-sm whitespace-nowrap">{report.location}</td>
                        <td className="px-6 py-4 text-slate-600 text-sm whitespace-nowrap font-mono">{report.KKS || '-'}</td>
                        <td className="px-6 py-4 text-slate-600 text-sm truncate max-w-[200px]" title={report.content}>{report.content}</td>
                        <td className="px-6 py-4 text-slate-500 text-sm whitespace-nowrap">
                          {moment(report.timeStart).format('DD/MM/YYYY')}
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-sm whitespace-nowrap">
                          {moment(report.timeStop).format('DD/MM/YYYY')}
                        </td>
                        <td className="px-6 py-4 text-slate-700 text-sm whitespace-nowrap">{report.userId?.department || 'Kỹ thuật'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards */}
            <div className="block xl:hidden divide-y divide-slate-100">
              {reports.map(report => {
                const isAuthor = user?.admin || user?._id === report.userId?._id;
                return (
                  <div key={report._id} className="p-5 hover:bg-slate-50/70 transition-colors space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">WO: {report.WO}</span>
                        <h4 className="font-bold text-slate-800 text-sm">Hệ thống: {report.KKS || 'Chưa rõ'}</h4>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-800">
                        {report.userId?.department || 'Kỹ thuật'}
                      </span>
                    </div>

                    <p className="text-slate-600 text-sm line-clamp-2">{report.content}</p>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">
                      <div className="flex items-center gap-1.5"><UserIcon className="h-4 w-4" /> {report.userId?.name}</div>
                      <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {report.location}</div>
                    </div>

                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        onClick={() => router.push(`/admin/fastReport/${report._id}`)}
                        className="flex items-center gap-1 py-1.5 px-3 rounded-lg border border-slate-200 text-blue-600 hover:bg-blue-50 text-xs font-semibold"
                      >
                        <Eye className="h-3.5 w-3.5" /> Xem chi tiết
                      </button>
                      {isAuthor && (
                        <>
                          <button
                            onClick={() => handleOpenEditModal(report)}
                            className="flex items-center gap-1 py-1.5 px-3 rounded-lg border border-slate-200 text-emerald-600 hover:bg-emerald-50 text-xs font-semibold"
                          >
                            <Edit3 className="h-3.5 w-3.5" /> Sửa
                          </button>
                          {user?.vip && (
                            <button
                              onClick={() => handleDeleteReport(report)}
                              className="flex items-center gap-1 py-1.5 px-3 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50 text-xs font-semibold"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Xóa
                            </button>
                          )}
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
                Tổng số: <span className="font-bold text-slate-700">{totalReports}</span> bản ghi
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
                  disabled={page * limit >= totalReports}
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-slate-100 overflow-hidden animate-scale-in">
            
            <div className="h-14 flex items-center justify-between px-6 border-b border-slate-100 bg-slate-50">
              <h4 className="font-bold text-slate-800 text-sm uppercase">
                {editingReport ? 'Sửa Báo cáo nhanh' : 'Tạo Báo cáo nhanh mới'}
              </h4>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-200 text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReport}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {validationError && (
                  <div className="md:col-span-2 bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-xl text-sm font-semibold">
                    {validationError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Work Order *</label>
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
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Địa điểm *</label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Nhà máy Cà Mau..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Hệ thống / KKS</label>
                  <input
                    type="text"
                    value={formKks}
                    onChange={(e) => setFormKks(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Mã KKS thiết bị..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Thời gian xử lý</label>
                  <input
                    type="text"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Ví dụ: 2 giờ..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ngày bắt đầu *</label>
                  <input
                    type="date"
                    required
                    value={formTimeStart}
                    onChange={(e) => setFormTimeStart(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ngày kết thúc *</label>
                  <input
                    type="date"
                    required
                    value={formTimeStop}
                    onChange={(e) => setFormTimeStop(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nội dung công tác *</label>
                  <textarea
                    required
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    rows={2}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Nội dung công việc bảo trì..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Hiện tượng lỗi *</label>
                  <textarea
                    required
                    value={formError}
                    onChange={(e) => setFormError(e.target.value)}
                    rows={2}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Mô tả sự cố, hiện tượng lỗi thiết bị..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cách khắc phục, kết quả</label>
                  <textarea
                    value={formResult}
                    onChange={(e) => setFormResult(e.target.value)}
                    rows={2}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Phương án xử lý kỹ thuật và kết quả sau sửa chữa..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nhân sự thực hiện</label>
                  <input
                    type="text"
                    value={formEmploy}
                    onChange={(e) => setFormEmploy(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Tên các kỹ sư thực hiện..."
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
                  {formSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'LƯU BÁO CÁO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
