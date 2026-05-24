'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { ordersApi, authApi } from '../../../lib/api';
import { useRouter } from 'next/navigation';
import { 
  Search, Plus, Edit3, Trash2, Eye, Calendar, MapPin, 
  Settings, User as UserIcon, Lock, Loader2, Info, X
} from 'lucide-react';
import moment from 'moment';

export default function OrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search parameters
  const [searchWo, setSearchWo] = useState('');
  const [searchPct, setSearchPct] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [searchContent, setSearchContent] = useState('');
  const [searchStatus, setSearchStatus] = useState('ALL');
  const [searchWorkType, setSearchWorkType] = useState('ALL');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Modal form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [formWo, setFormWo] = useState('');
  const [formPct, setFormPct] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formKks, setFormKks] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formWorkType, setFormWorkType] = useState('PM');
  const [formStatus, setFormStatus] = useState('START');
  const [formTimeStart, setFormTimeStart] = useState('');
  const [formTimeStop, setFormTimeStop] = useState('');
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

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {
        wo: searchWo,
        pct: searchPct,
        userId: searchUser ? [searchUser] : [],
        content: searchContent,
        status: searchStatus,
        workType: searchWorkType,
        skip: (page - 1) * limit,
        limit: limit,
      };
      const response = await ordersApi.getOrders(params);
      if (response && response.Data) {
        setOrders(response.Data.Row || []);
        setTotalOrders(response.Data.Total || 0);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [searchWo, searchPct, searchUser, searchContent, searchStatus, searchWorkType, page, limit]);

  const handleOpenAddModal = () => {
    setEditingOrder(null);
    setFormWo('');
    setFormPct('');
    setFormLocation('');
    setFormKks('');
    setFormContent('');
    setFormWorkType('PM');
    setFormStatus('START');
    setFormTimeStart(moment().format('YYYY-MM-DD'));
    setFormTimeStop(moment().add(7, 'days').format('YYYY-MM-DD'));
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (order) => {
    setEditingOrder(order);
    setFormWo(order.WO || '');
    setFormPct(order.PCT || '');
    setFormLocation(order.location || '');
    setFormKks(order.KKS || '');
    setFormContent(order.content || '');
    setFormWorkType(order.workType || 'PM');
    setFormStatus(order.status || 'START');
    setFormTimeStart(moment(order.timeStart).format('YYYY-MM-DD'));
    setFormTimeStop(moment(order.timeStop).format('YYYY-MM-DD'));
    setFormError('');
    setModalOpen(true);
  };

  const handleSaveOrder = async (e) => {
    e.preventDefault();
    if (!formWo || !formPct || !formLocation || !formContent) {
      setFormError('Vui lòng điền đầy đủ các trường thông tin bắt buộc');
      return;
    }
    setFormError('');
    setFormSaving(true);

    const orderData = {
      WO: formWo,
      PCT: formPct,
      location: formLocation,
      KKS: formKks,
      content: formContent,
      workType: formWorkType,
      status: formStatus,
      timeStart: new Date(formTimeStart).toISOString(),
      timeStop: new Date(formTimeStop).toISOString(),
    };

    try {
      if (editingOrder) {
        await ordersApi.updateOrder(editingOrder._id, orderData);
      } else {
        await ordersApi.createOrder(orderData);
      }
      setModalOpen(false);
      fetchOrders();
    } catch (error) {
      setFormError(error.response?.data || 'Có lỗi xảy ra khi lưu Work Order');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteOrder = async (order) => {
    if (!confirm('Bạn có chắc chắn muốn xóa Work Order này?')) return;
    try {
      await ordersApi.deleteOrder(order._id);
      fetchOrders();
    } catch (error) {
      alert('Không thể xóa Work Order này');
    }
  };

  // Convert Work Type
  const getWorkTypeLabel = (type) => {
    switch (type) {
      case 'PM': return 'Thường Xuyên';
      case 'CM': return 'Bất Thường';
      case 'A': return 'Tiểu Tu';
      case 'B': return 'Trung Tu';
      case 'C': return 'Đại Tu';
      default: return type;
    }
  };

  // Status styling
  const getStatusBadge = (status) => {
    let styles = 'bg-slate-100 text-slate-700 border-slate-200';
    if (status === 'START') styles = 'bg-sky-50 text-sky-700 border-sky-200';
    else if (status === 'READY') styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    else if (status === 'IN PROGRESS') styles = 'bg-amber-50 text-amber-700 border-amber-200';
    else if (status.startsWith('INPRG')) styles = 'bg-orange-50 text-orange-700 border-orange-200';
    else if (status === 'COMPLETE') styles = 'bg-teal-50 text-teal-700 border-teal-200';
    else if (status === 'CLOSE') styles = 'bg-slate-200 text-slate-800 border-slate-300';

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Danh sách Work Order (Phiếu công tác)</h2>
          <p className="text-xs text-slate-500">Giám sát công việc, phân loại an toàn và danh sách thiết bị</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md shadow-blue-600/10"
        >
          <Plus className="h-4.5 w-4.5" />
          THÊM WORK ORDER
        </button>
      </div>

      {/* Filter Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
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
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Số PCT</label>
          <div className="relative">
            <input
              type="text"
              value={searchPct}
              onChange={(e) => setSearchPct(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              placeholder="Số phiếu..."
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
            <option value="INPRG NO TOOL">INPRG NO TOOL</option>
            <option value="INPRG HAVE TOOL">INPRG HAVE TOOL</option>
            <option value="COMPLETE">COMPLETE</option>
            <option value="CLOSE">CLOSE</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Work Type</label>
          <select
            value={searchWorkType}
            onChange={(e) => setSearchWorkType(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          >
            <option value="ALL">Tất cả</option>
            <option value="PM">Thường Xuyên (PM)</option>
            <option value="CM">Bất Thường (CM)</option>
            <option value="A">Tiểu Tu (A)</option>
            <option value="B">Trung Tu (B)</option>
            <option value="C">Đại Tu (C)</option>
          </select>
        </div>
      </div>

      {/* Main Table / Mobile Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
            <p className="mt-4 text-slate-500 text-sm">Đang tải danh sách Work Order...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-24 text-center text-slate-400">
            <Info className="h-12 w-12 mx-auto mb-3" />
            Không tìm thấy Work Order nào
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden xl:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Hành động</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Work Order</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Số PCT</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Tạo bởi</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Phân loại</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Trạng thái</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Địa điểm</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Hệ thống/KKS</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Nội dung</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Ngày thực hiện</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {orders.map(order => {
                    const isAuthor = user?.admin || user?._id === order.userId?._id;
                    return (
                      <tr key={order._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => router.push(`/admin/order/${order._id}`)}
                              className="p-1.5 rounded-lg border border-slate-200 text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Chi tiết"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {isAuthor && (
                              <>
                                <button
                                  onClick={() => handleOpenEditModal(order)}
                                  className="p-1.5 rounded-lg border border-slate-200 text-emerald-600 hover:bg-emerald-50 transition-colors"
                                  title="Sửa"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteOrder(order)}
                                  className="p-1.5 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50 transition-colors"
                                  title="Xóa"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-800 text-sm whitespace-nowrap">{order.WO}</td>
                        <td className="px-4 py-3 font-semibold text-slate-700 text-sm whitespace-nowrap">{order.PCT}</td>
                        <td className="px-4 py-3 text-slate-700 text-sm whitespace-nowrap">{order.userId?.name}</td>
                        <td className="px-4 py-3 text-slate-600 text-sm whitespace-nowrap">{getWorkTypeLabel(order.workType)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(order.status)}</td>
                        <td className="px-4 py-3 text-slate-600 text-sm truncate max-w-[120px]">{order.location}</td>
                        <td className="px-4 py-3 text-slate-600 text-sm truncate max-w-[120px]">{order.KKS}</td>
                        <td className="px-4 py-3 text-slate-600 text-sm truncate max-w-[300px]" title={order.content}>{order.content}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                          {moment(order.timeStart).format('DD/MM/YYYY')} - {moment(order.timeStop).format('DD/MM/YYYY')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards */}
            <div className="block xl:hidden divide-y divide-slate-100">
              {orders.map(order => {
                const isAuthor = user?.admin || user?._id === order.userId?._id;
                return (
                  <div key={order._id} className="p-5 hover:bg-slate-50/70 transition-colors space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">WO: {order.WO}</span>
                        <h4 className="font-bold text-slate-800 text-sm">Số PCT: {order.PCT}</h4>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>

                    <p className="text-slate-600 text-sm line-clamp-2">{order.content}</p>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">
                      <div className="flex items-center gap-1.5"><UserIcon className="h-4 w-4" /> {order.userId?.name}</div>
                      <div className="flex items-center gap-1.5"><Settings className="h-4 w-4" /> {getWorkTypeLabel(order.workType)}</div>
                      <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {order.location}</div>
                      <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {moment(order.timeStart).format('DD/MM')} - {moment(order.timeStop).format('DD/MM')}</div>
                    </div>

                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        onClick={() => router.push(`/admin/order/${order._id}`)}
                        className="flex items-center gap-1 py-1.5 px-3 rounded-lg border border-slate-200 text-blue-600 hover:bg-blue-50 text-xs font-semibold"
                      >
                        <Eye className="h-3.5 w-3.5" /> Xem chi tiết
                      </button>
                      {isAuthor && (
                        <>
                          <button
                            onClick={() => handleOpenEditModal(order)}
                            className="flex items-center gap-1 py-1.5 px-3 rounded-lg border border-slate-200 text-emerald-600 hover:bg-emerald-50 text-xs font-semibold"
                          >
                            <Edit3 className="h-3.5 w-3.5" /> Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order)}
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
                Tổng số: <span className="font-bold text-slate-700">{totalOrders}</span> bản ghi
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
                  disabled={page * limit >= totalOrders}
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
                {editingOrder ? 'Sửa Work Order' : 'Tạo Work Order mới'}
              </h4>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-200 text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOrder}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {formError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-xl text-sm font-semibold">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
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
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Số Phiếu PCT *</label>
                    <input
                      type="text"
                      required
                      value={formPct}
                      onChange={(e) => setFormPct(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Số phiếu PCT..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Địa điểm công tác *</label>
                    <input
                      type="text"
                      required
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Nơi làm việc..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Hệ thống / Mã KKS</label>
                    <input
                      type="text"
                      value={formKks}
                      onChange={(e) => setFormKks(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Ví dụ: 10LBA10..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ngày bắt đầu</label>
                    <input
                      type="date"
                      required
                      value={formTimeStart}
                      onChange={(e) => setFormTimeStart(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ngày kết thúc</label>
                    <input
                      type="date"
                      required
                      value={formTimeStop}
                      onChange={(e) => setFormTimeStop(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Phân loại Work Type</label>
                    <select
                      value={formWorkType}
                      onChange={(e) => setFormWorkType(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="PM">Thường Xuyên (PM)</option>
                      <option value="CM">Bất Thường (CM)</option>
                      <option value="A">Tiểu Tu (A)</option>
                      <option value="B">Trung Tu (B)</option>
                      <option value="C">Đại Tu (C)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Trạng thái</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="START">START</option>
                      <option value="READY">READY</option>
                      <option value="IN PROGRESS">IN PROGRESS</option>
                      <option value="COMPLETE">COMPLETE</option>
                      <option value="CLOSE">CLOSE</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nội dung công tác *</label>
                  <textarea
                    required
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Mô tả công việc chi tiết..."
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
