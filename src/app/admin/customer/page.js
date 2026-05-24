'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { authApi } from '../../../lib/api';
import { useRouter } from 'next/navigation';
import { 
  Search, Plus, Edit3, Trash2, Shield, UserCheck, 
  User as UserIcon, Loader2, Info, X, Phone, Mail, Building
} from 'lucide-react';

export default function CustomersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search parameters
  const [searchEmail, setSearchEmail] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchDept, setSearchDept] = useState('');
  const [searchGroup, setSearchGroup] = useState('');
  const [searchRole, setSearchRole] = useState('ALL');

  // Modal form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDept, setFormDept] = useState('');
  const [formGroup, setFormGroup] = useState('');
  const [formAdmin, setFormAdmin] = useState(false);
  const [formPkt, setFormPkt] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await authApi.getUsers();
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !user.admin) {
      alert('Bạn không có quyền truy cập trang này.');
      router.push('/admin/order');
      return;
    }
    fetchCustomers();
  }, [user]);

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('123456');
    setFormPhone('');
    setFormDept('');
    setFormGroup('');
    setFormAdmin(false);
    setFormPkt(false);
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (customer) => {
    setEditingCustomer(customer);
    setFormName(customer.name || '');
    setFormEmail(customer.email || '');
    setFormPassword(''); // Empty means don't change
    setFormPhone(customer.phone || '');
    setFormDept(customer.department || '');
    setFormGroup(customer.group || '');
    setFormAdmin(customer.admin || false);
    setFormPkt(customer.pkt || false);
    setFormError('');
    setModalOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!formName || !formEmail) {
      setFormError('Họ tên và Email là bắt buộc');
      return;
    }
    setFormError('');
    setFormSaving(true);

    const customerData = {
      name: formName,
      email: formEmail,
      phone: formPhone,
      department: formDept,
      group: formGroup,
      admin: formAdmin,
      pkt: formPkt,
    };

    if (formPassword) {
      customerData.password = formPassword;
    }

    try {
      if (editingCustomer) {
        await authApi.updateUser(editingCustomer._id, customerData);
      } else {
        await authApi.register(customerData);
      }
      setModalOpen(false);
      fetchCustomers();
    } catch (error) {
      setFormError(error.response?.data || 'Có lỗi xảy ra khi lưu người dùng');
    } finally {
      setFormSaving(false);
    }
  };

  const handleResetPassword = async (customer) => {
    if (!confirm(`Khôi phục mật khẩu tài khoản "${customer.name}" về mặc định "123456"?`)) return;
    try {
      const resetData = {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        department: customer.department,
        group: customer.group,
        admin: customer.admin,
        pkt: customer.pkt,
        password: '123456',
      };
      await authApi.updateUser(customer._id, resetData);
      alert('Đã khôi phục mật khẩu thành công về "123456"');
    } catch (error) {
      alert('Không thể khôi phục mật khẩu');
    }
  };

  const handleDeleteCustomer = async (customer) => {
    if (customer._id === user._id) {
      alert('Bạn không thể tự xóa tài khoản của chính mình!');
      return;
    }
    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản "${customer.name}"?`)) return;
    try {
      await authApi.deleteUser(customer._id);
      fetchCustomers();
    } catch (error) {
      alert('Không thể xóa người dùng này');
    }
  };

  // Local filtering
  const filteredCustomers = customers.filter(c => {
    if (c._id === user?._id) return false; // Hide self from editable table to prevent lockout
    
    const matchesEmail = c.email?.toLowerCase().includes(searchEmail.toLowerCase());
    const matchesName = c.name?.toLowerCase().includes(searchName.toLowerCase());
    const matchesPhone = String(c.phone || '').includes(searchPhone);
    const matchesDept = c.department?.toLowerCase().includes(searchDept.toLowerCase());
    const matchesGroup = c.group?.toLowerCase().includes(searchGroup.toLowerCase());
    
    let matchesRole = true;
    if (searchRole === 'ADMIN') matchesRole = c.admin === true;
    else if (searchRole === 'PKT') matchesRole = c.pkt === true;
    else if (searchRole === 'USER') matchesRole = !c.admin && !c.pkt;

    return matchesEmail && matchesName && matchesPhone && matchesDept && matchesGroup && matchesRole;
  });

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quản lý tài khoản Kỹ sư & Cán bộ</h2>
          <p className="text-xs text-slate-500">Phân quyền vai trò hệ thống, phân bổ tổ và phòng ban kỹ thuật</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md shadow-blue-600/10"
        >
          <Plus className="h-4.5 w-4.5" />
          THÊM TÀI KHOẢN
        </button>
      </div>

      {/* Filter Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Họ và tên</label>
          <div className="relative">
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              placeholder="Tên..."
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Email</label>
          <div className="relative">
            <input
              type="text"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              placeholder="Email..."
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Số điện thoại</label>
          <div className="relative">
            <input
              type="text"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              placeholder="SĐT..."
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Phân Xưởng</label>
          <div className="relative">
            <input
              type="text"
              value={searchDept}
              onChange={(e) => setSearchDept(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              placeholder="PX..."
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Tổ bảo trì</label>
          <div className="relative">
            <input
              type="text"
              value={searchGroup}
              onChange={(e) => setSearchGroup(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              placeholder="Tổ..."
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Phân quyền</label>
          <select
            value={searchRole}
            onChange={(e) => setSearchRole(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="ADMIN">Quản trị viên (Admin)</option>
            <option value="PKT">Cán bộ Kỹ thuật (Pkt)</option>
            <option value="USER">Kỹ sư vận hành (User)</option>
          </select>
        </div>
      </div>

      {/* Main Table / Mobile Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
            <p className="mt-4 text-slate-500 text-sm">Đang tải danh sách tài khoản...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-24 text-center text-slate-400">
            <Info className="h-12 w-12 mx-auto mb-3" />
            Không tìm thấy tài khoản nào phù hợp
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Hành động</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Tên cán bộ</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Số điện thoại</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Phân Xưởng</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Tổ bảo trì</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Vai trò</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {filteredCustomers.map(customer => (
                    <tr key={customer._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenEditModal(customer)}
                            className="p-1.5 rounded-lg border border-slate-200 text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Sửa profile"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(customer)}
                            className="px-2 py-1 rounded-lg border border-slate-200 text-amber-600 hover:bg-amber-50 text-xs font-bold transition-colors"
                            title="Reset Password"
                          >
                            RESET PASS
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(customer)}
                            className="p-1.5 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50 transition-colors"
                            title="Xóa tài khoản"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800 whitespace-nowrap">{customer.name}</td>
                      <td className="px-6 py-4 text-slate-700 whitespace-nowrap">{customer.email}</td>
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                        {customer.phone ? `(+84) ${customer.phone}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-700 whitespace-nowrap">{customer.department || '-'}</td>
                      <td className="px-6 py-4 text-slate-700 whitespace-nowrap">{customer.group || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-1.5">
                          {customer.admin && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
                              Admin
                            </span>
                          )}
                          {customer.pkt && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                              Phòng Kỹ Thuật (Pkt)
                            </span>
                          )}
                          {!customer.admin && !customer.pkt && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-100">
                              Kỹ sư
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards */}
            <div className="block lg:hidden divide-y divide-slate-100">
              {filteredCustomers.map(customer => (
                <div key={customer._id} className="p-5 hover:bg-slate-50/70 transition-colors space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-slate-800 text-sm">{customer.name}</h4>
                    <div className="flex gap-1">
                      {customer.admin && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-100">Admin</span>
                      )}
                      {customer.pkt && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">Pkt</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-1 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">
                    <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {customer.email}</div>
                    <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {customer.phone || '-'}</div>
                    <div className="flex items-center gap-1.5"><Building className="h-3.5 w-3.5" /> {customer.department} / {customer.group}</div>
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      onClick={() => handleOpenEditModal(customer)}
                      className="flex items-center gap-1 py-1.5 px-3 rounded-lg border border-slate-200 text-emerald-600 hover:bg-emerald-50 text-xs font-semibold"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Sửa
                    </button>
                    <button
                      onClick={() => handleResetPassword(customer)}
                      className="flex items-center gap-1 py-1.5 px-3 rounded-lg border border-slate-200 text-amber-600 hover:bg-amber-50 text-xs font-semibold"
                    >
                      Reset Pass
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(customer)}
                      className="flex items-center gap-1 py-1.5 px-3 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50 text-xs font-semibold"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Xóa
                    </button>
                  </div>
                </div>
              ))}
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
                {editingCustomer ? 'Sửa thông tin tài khoản' : 'Tạo tài khoản mới'}
              </h4>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-200 text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {formError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-xl text-sm font-semibold">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Nguyễn Văn A..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="email@pvps.vn..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    {editingCustomer ? 'Mật khẩu mới (Để trống nếu không thay đổi)' : 'Mật khẩu *'}
                  </label>
                  <input
                    type="password"
                    required={!editingCustomer}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder={editingCustomer ? "Bỏ trống để giữ mật khẩu cũ..." : "Nhập mật khẩu..."}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Số điện thoại</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="0912345678..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Phân Xưởng</label>
                    <input
                      type="text"
                      value={formDept}
                      onChange={(e) => setFormDept(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Phân xưởng bảo trì..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tổ chuyên môn</label>
                    <input
                      type="text"
                      value={formGroup}
                      onChange={(e) => setFormGroup(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Tổ Kiểm Nhiệt/Tự Động..."
                    />
                  </div>
                </div>

                <div className="flex gap-6 border-t border-slate-100 pt-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formAdmin}
                      onChange={(e) => setFormAdmin(e.target.checked)}
                      className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Quản trị viên (Admin)
                  </label>

                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPkt}
                      onChange={(e) => setFormPkt(e.target.checked)}
                      className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Cán bộ Kỹ thuật (Pkt)
                  </label>
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
                  {formSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'LƯU TÀI KHOẢN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
