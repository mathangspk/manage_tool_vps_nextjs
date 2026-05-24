'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { toolsApi } from '../../../lib/api';
import { 
  Search, Plus, Edit3, Trash2, Calendar, FileImage, 
  Info, CheckCircle, HelpCircle, AlertTriangle, AlertOctagon, X, Loader2
} from 'lucide-react';

export default function ToolsPage() {
  const { user } = useAuth();
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTool, setSelectedTool] = useState(null);


  // Modal form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState(null);
  const [formName, setFormName] = useState('');
  const [formManufacturer, setFormManufacturer] = useState('');
  const [formType, setFormType] = useState('');
  const [formStatus, setFormStatus] = useState(1);
  const [formImageId, setFormImageId] = useState('');
  const [formError, setFormError] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  // Temporary input states for search debouncing
  const [nameInput, setNameInput] = useState('');
  const [manufacturerInput, setManufacturerInput] = useState('');
  const [typeInput, setTypeInput] = useState('');
  const [userInput, setUserInput] = useState('');

  // Search parameters state triggers
  const [searchName, setSearchName] = useState('');
  const [searchManufacturer, setSearchManufacturer] = useState('');
  const [searchType, setSearchType] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [searchStatus, setSearchStatus] = useState('all');

  // Debounce search parameters
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchName(nameInput);
      setSearchManufacturer(manufacturerInput);
      setSearchType(typeInput);
      setSearchUser(userInput);
    }, 450); // 450ms debounce
    return () => clearTimeout(timer);
  }, [nameInput, manufacturerInput, typeInput, userInput]);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalTools, setTotalTools] = useState(0);

  const fetchTools = async () => {
    setLoading(true);
    try {
      const params = {
        name: searchName,
        manufacturer: searchManufacturer,
        type: searchType,
        userName: searchUser,
        status: searchStatus,
        skip: (page - 1) * limit,
        limit: limit,
      };
      const response = await toolsApi.getTools(params);
      if (response && response.Data) {
        const rows = response.Data.Row || [];
        setTools(rows);
        setTotalTools(response.Data.Total || 0);
        // If a tool was selected, update its reference in state
        if (selectedTool) {
          const updated = rows.find(t => t._id === selectedTool._id);
          setSelectedTool(updated || null);
        }
      }
    } catch (error) {
      console.error('Error fetching tools:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset page when search parameters change
  useEffect(() => {
    setPage(1);
  }, [searchName, searchManufacturer, searchType, searchUser, searchStatus]);

  useEffect(() => {
    fetchTools();
  }, [searchName, searchManufacturer, searchType, searchUser, searchStatus, page, limit]);

  const handleOpenAddModal = () => {
    setEditingTool(null);
    setFormName('');
    setFormManufacturer('');
    setFormType('');
    setFormStatus(1);
    setFormImageId('');
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (tool) => {
    setEditingTool(tool);
    setFormName(tool.name);
    setFormManufacturer(tool.manufacturer || '');
    setFormType(tool.type || '');
    setFormStatus(tool.status || 1);
    setFormImageId(tool.images?.[0]?.idImage || '');
    setFormError('');
    setModalOpen(true);
  };

  const handleSaveTool = async (e) => {
    e.preventDefault();
    if (!formName || !formManufacturer || !formType) {
      setFormError('Vui lòng nhập đầy đủ các trường thông tin bắt buộc');
      return;
    }
    setFormError('');
    setFormSaving(true);

    const imagesArray = formImageId ? [{ idImage: formImageId }] : [];

    const toolData = {
      name: formName,
      manufacturer: formManufacturer,
      type: formType,
      status: parseInt(formStatus),
      images: imagesArray,
    };

    try {
      if (editingTool) {
        await toolsApi.updateTool(editingTool._id, toolData);
      } else {
        await toolsApi.createTool(toolData);
      }
      setModalOpen(false);
      fetchTools();
    } catch (error) {
      setFormError(error.response?.data?.message || 'Có lỗi xảy ra khi lưu dụng cụ');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteTool = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa công cụ này?')) return;
    try {
      await toolsApi.deleteTool(id);
      if (selectedTool?._id === id) setSelectedTool(null);
      fetchTools();
    } catch (error) {
      alert('Không thể xóa công cụ này');
    }
  };

  // Get status color badges
  const getStatusBadge = (status) => {
    switch (status) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="h-3.5 w-3.5" /> READY
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <HelpCircle className="h-3.5 w-3.5" /> IN USE
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="h-3.5 w-3.5" /> BAD
          </span>
        );
      case 4:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <AlertOctagon className="h-3.5 w-3.5" /> LOST
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            UNKNOWN
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header (Actions) */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Kho Dụng Cụ Thiết Bị</h2>
          <p className="text-xs text-slate-500">Xem danh sách, tìm kiếm và quản lý dụng cụ bảo trì</p>
        </div>
        {user?.admin && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md shadow-blue-600/10"
          >
            <Plus className="h-4.5 w-4.5" />
            THÊM MỚI CÔNG CỤ
          </button>
        )}
      </div>

      {/* Filter Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Tên công cụ</label>
          <div className="relative">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              placeholder="Nhập tên..."
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Hãng</label>
          <div className="relative">
            <input
              type="text"
              value={manufacturerInput}
              onChange={(e) => setManufacturerInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              placeholder="Nhập hãng..."
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Loại</label>
          <div className="relative">
            <input
              type="text"
              value={typeInput}
              onChange={(e) => setTypeInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              placeholder="Nhập loại..."
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Người dùng</label>
          <div className="relative">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              placeholder="Nhập tên..."
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
            <option value="all">Tất cả trạng thái</option>
            <option value="1">READY (Sẵn sàng)</option>
            <option value="2">IN USE (Đang mượn)</option>
            <option value="3">BAD (Hỏng)</option>
            <option value="4">LOST (Mất)</option>
          </select>
        </div>

      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Table & Mobile Cards */}
        <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-2`}>
          {loading ? (
            <div className="py-24 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
              <p className="mt-4 text-slate-500 text-sm">Đang tải danh sách...</p>
            </div>
          ) : tools.length === 0 ? (
            <div className="py-24 text-center text-slate-400">
              <Info className="h-12 w-12 mx-auto mb-3" />
              Không tìm thấy dụng cụ nào phù hợp
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Hành động</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tên công cụ</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Hãng</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Loại</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Phiếu công tác</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {tools.map((tool) => (
                      <tr 
                        key={tool._id} 
                        onClick={() => setSelectedTool(tool)}
                        className={`hover:bg-slate-50/70 cursor-pointer transition-colors ${selectedTool?._id === tool._id ? 'bg-blue-50/30' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                          {user?.admin ? (
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleOpenEditModal(tool)}
                                className="p-1.5 rounded-lg border border-slate-200 text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Sửa"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteTool(tool._id)}
                                className="p-1.5 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50 transition-colors"
                                title="Xóa"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">Không có quyền</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800 text-sm">{tool.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusBadge(tool.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 text-sm">{tool.manufacturer}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 text-sm">{tool.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-sm">
                          {tool.wo ? (
                            <span className="font-semibold text-blue-600">{tool.wo}</span>
                          ) : (
                            <span className="text-slate-400 italic">Trống</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="block md:hidden divide-y divide-slate-100">
                {tools.map((tool) => (
                  <div 
                    key={tool._id} 
                    onClick={() => setSelectedTool(tool)}
                    className={`p-4 hover:bg-slate-50/70 cursor-pointer space-y-3 ${selectedTool?._id === tool._id ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-slate-800 text-sm">{tool.name}</h4>
                      {getStatusBadge(tool.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-slate-500">
                      <div>Hãng: <span className="font-semibold text-slate-700">{tool.manufacturer}</span></div>
                      <div>Loại: <span className="font-semibold text-slate-700">{tool.type}</span></div>
                      {tool.wo && (
                        <div className="col-span-2 mt-1">
                          Đang gắn với WO: <span className="font-bold text-blue-600">{tool.wo}</span>
                        </div>
                      )}
                    </div>
                    {user?.admin && (
                      <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => handleOpenEditModal(tool)}
                          className="flex items-center gap-1 py-1.5 px-3 rounded-lg border border-slate-200 text-blue-600 hover:bg-blue-50 text-xs font-semibold"
                        >
                          <Edit3 className="h-3.5 w-3.5" /> Sửa
                        </button>
                        <button 
                          onClick={() => handleDeleteTool(tool._id)}
                          className="flex items-center gap-1 py-1.5 px-3 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50 text-xs font-semibold"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Xóa
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              <div className="h-16 flex items-center justify-between px-6 border-t border-slate-100 bg-slate-50 text-slate-500 text-sm">
                <div>
                  Tổng số: <span className="font-bold text-slate-700">{totalTools}</span> dụng cụ
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-100 rounded-lg disabled:opacity-50 text-xs font-semibold transition-all"
                  >
                    TRƯỚC
                  </button>
                  <span className="flex items-center px-3 text-xs font-bold text-slate-700">Trang {page}</span>
                  <button
                    type="button"
                    disabled={page * limit >= totalTools}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-100 rounded-lg disabled:opacity-50 text-xs font-semibold transition-all"
                  >
                    TIẾP
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Selected Tool Details Sidebar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <h3 className="font-bold text-slate-800 text-md border-b border-slate-100 pb-3 flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            Chi tiết dụng cụ
          </h3>

          {selectedTool ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase">Tên công cụ</span>
                <p className="font-bold text-slate-800 text-lg">{selectedTool.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase">Hãng</span>
                  <p className="font-semibold text-slate-700 text-sm">{selectedTool.manufacturer}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase">Loại</span>
                  <p className="font-semibold text-slate-700 text-sm">{selectedTool.type}</p>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase">Trạng thái hiện tại</span>
                <div className="pt-1">{getStatusBadge(selectedTool.status)}</div>
              </div>

              {selectedTool.wo && (
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-blue-500 uppercase">Thông tin Work Order</span>
                  <p className="font-bold text-slate-800 text-sm">WO: {selectedTool.wo}</p>
                  <p className="text-xs text-slate-500">Mượn bởi cán bộ: <span className="font-semibold text-slate-700">{selectedTool.userName || 'Chưa cập nhật'}</span></p>
                </div>
              )}

              {/* Image Gallery */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-400 uppercase block">Hình ảnh thực tế</span>
                {selectedTool.images && selectedTool.images.length > 0 ? (
                  <div className="relative group border border-slate-200 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center h-48 shadow-inner">
                    <img 
                      src={`https://drive.google.com/uc?export=view&id=${selectedTool.images[0].idImage}`} 
                      alt={selectedTool.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm">
                    <FileImage className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    Không có hình ảnh
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-sm text-center py-12 italic">
              Chọn một dụng cụ từ danh sách để xem chi tiết và hình ảnh.
            </p>
          )}
        </div>

      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden animate-scale-in">
            
            {/* Modal Header */}
            <div className="h-14 flex items-center justify-between px-6 border-b border-slate-100 bg-slate-50">
              <h4 className="font-bold text-slate-800 text-sm uppercase">
                {editingTool ? 'Cập nhật dụng cụ' : 'Thêm dụng cụ mới'}
              </h4>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveTool}>
              <div className="p-6 space-y-4">
                
                {formError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-xl text-sm font-semibold">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tên công cụ *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ví dụ: Kìm bấm mạng RJ45"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Hãng sản xuất *</label>
                    <input
                      type="text"
                      required
                      value={formManufacturer}
                      onChange={(e) => setFormManufacturer(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ví dụ: Tolsen"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Phân loại *</label>
                    <input
                      type="text"
                      required
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ví dụ: Cầm tay"
                    />
                  </div>
                </div>

                {editingTool && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Trạng thái thiết bị</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1">READY (Sẵn sàng)</option>
                      <option value="2">IN USE (Đang sử dụng)</option>
                      <option value="3">BAD (Hỏng hóc)</option>
                      <option value="4">LOST (Bị thất lạc)</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">ID ảnh Google Drive (Tùy chọn)</label>
                  <input
                    type="text"
                    value={formImageId}
                    onChange={(e) => setFormImageId(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    placeholder="Mã file Drive (ví dụ: 1IUSyoKAYbTAh...)"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Dùng để đồng bộ hình ảnh thực tế được mượn trả từ Google Drive.</p>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="h-16 flex items-center justify-end px-6 border-t border-slate-100 bg-slate-50 gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-colors"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/10 flex items-center gap-2"
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
