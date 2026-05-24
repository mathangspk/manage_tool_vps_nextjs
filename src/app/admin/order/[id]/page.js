'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { ordersApi, toolsApi } from '../../../../lib/api';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Calendar, MapPin, Settings, User as UserIcon, CheckCircle, 
  Wrench, Users, Plus, X, Trash2, ArrowLeftRight, Download, Play, Check, Lock, Loader2
} from 'lucide-react';
import moment from 'moment';

export default function OrderDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tools, setTools] = useState([]); // Tools currently in the order
  const [availableTools, setAvailableTools] = useState([]); // Tools available in the warehouse to add
  
  // States for Team Members
  const [newMemberName, setNewMemberName] = useState('');

  // States for Adding Tools Modal
  const [addToolsModalOpen, setAddToolsModalOpen] = useState(false);
  const [searchToolName, setSearchToolName] = useState('');
  const [searchToolManufacturer, setSearchToolManufacturer] = useState('');
  const [searchToolType, setSearchToolType] = useState('');
  const [addingTool, setAddingTool] = useState(false);

  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      const data = await ordersApi.getOrderById(orderId);
      setOrder(data);
      if (data && data.toolId) {
        setTools(data.toolId);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTools = async () => {
    try {
      const params = {
        name: searchToolName,
        manufacturer: searchToolManufacturer,
        type: searchToolType,
        status: 1, // Only READY tools
      };
      const data = await toolsApi.getTools(params);
      // Filter out tools already in this order
      const existingIds = tools.map(t => t._id);
      const filtered = data.filter(t => !existingIds.includes(t._id));
      setAvailableTools(filtered);
    } catch (error) {
      console.error('Error fetching available tools:', error);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);

  useEffect(() => {
    if (addToolsModalOpen) {
      fetchAvailableTools();
    }
  }, [addToolsModalOpen, searchToolName, searchToolManufacturer, searchToolType]);

  // Add Member
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    try {
      const updatedMembers = [...(order.NV || []), { name: newMemberName.trim() }];
      const updated = await ordersApi.updateOrder(orderId, { ...order, NV: updatedMembers });
      setOrder(updated);
      setNewMemberName('');
    } catch (error) {
      alert('Không thể thêm thành viên');
    }
  };

  // Remove Member
  const handleRemoveMember = async (index) => {
    try {
      const updatedMembers = [...(order.NV || [])];
      updatedMembers.splice(index, 1);
      const updated = await ordersApi.updateOrder(orderId, { ...order, NV: updatedMembers });
      setOrder(updated);
    } catch (error) {
      alert('Không thể xóa thành viên');
    }
  };

  // Add Tool to Order
  const handleAddToolToOrder = async (tool) => {
    setAddingTool(true);
    try {
      // 1. Update the tool status to IN USE (2) and set its wo code
      const updatedTool = {
        ...tool,
        status: 2,
        wo: order.WO,
        woInfo: order
      };
      await toolsApi.updateTool(tool._id, updatedTool);
      
      // 2. Refresh the details
      await fetchOrderDetail();
      fetchAvailableTools();
    } catch (error) {
      console.error('Error adding tool:', error);
      alert('Có lỗi xảy ra khi thêm dụng cụ');
    } finally {
      setAddingTool(false);
    }
  };

  // Return Tool to Warehouse (Status -> 1, wo -> "")
  const handleReturnTool = async (tool) => {
    if (!confirm(`Xác nhận trả dụng cụ "${tool.name}" về kho?`)) return;
    try {
      const updatedTool = {
        ...tool,
        status: 1,
        wo: '',
        woInfo: null
      };
      await toolsApi.updateTool(tool._id, updatedTool);
      
      // Refresh order
      fetchOrderDetail();
    } catch (error) {
      alert('Có lỗi xảy ra khi trả dụng cụ');
    }
  };

  // Completely Remove Tool from WO List
  const handleRemoveToolFromOrder = async (tool) => {
    if (!confirm(`Xác nhận xóa hẳn dụng cụ "${tool.name}" ra khỏi danh sách WO?`)) return;
    try {
      const updatedTool = {
        ...tool,
        status: 1,
        wo: '',
        woInfo: null
      };
      await toolsApi.updateTool(tool._id, updatedTool);

      // Remove from order tool list
      const updatedToolIds = order.toolId.filter(t => t._id !== tool._id).map(t => t._id);
      await ordersApi.updateOrder(orderId, {
        ...order,
        toolId: updatedToolIds
      });

      fetchOrderDetail();
    } catch (error) {
      alert('Có lỗi xảy ra khi gỡ dụng cụ');
    }
  };

  // Verify State transitions
  const handleVerifyState = async () => {
    let nextStatus = order.status;
    const haveTools = tools.length > 0;

    switch (order.status) {
      case 'START':
        nextStatus = haveTools ? 'READY' : 'INPRG NO TOOL';
        break;
      case 'READY':
        nextStatus = 'IN PROGRESS';
        break;
      case 'IN PROGRESS':
      case 'INPRG HAVE TOOL':
        nextStatus = 'INPRG NO TOOL';
        break;
      case 'INPRG NO TOOL':
        if (confirm("Xác nhận hoàn thành tất cả công việc theo phiếu công tác?")) {
          nextStatus = 'COMPLETE';
        }
        break;
      case 'COMPLETE':
        if (user.pkt || user.admin) {
          nextStatus = 'CLOSE';
        }
        break;
      default:
        break;
    }

    try {
      const updated = await ordersApi.updateOrder(orderId, {
        ...order,
        status: nextStatus
      });
      setOrder(updated);
      fetchOrderDetail();
    } catch (error) {
      alert('Có lỗi xảy ra khi chuyển trạng thái');
    }
  };

  // Export docx (download) client-side
  const handleExportDoc = () => {
    // Generate a basic HTML/Text report for compatibility since docx requires heavier library configs
    const docText = `
BIÊN BẢN BÀN GIAO CÔNG CỤ DỤNG CỤ
===================================
Hệ thống: PVPS Maintenance
Ngày tạo: ${moment().format('DD/MM/YYYY')}

Thông tin Work Order:
- WO: ${order.WO}
- PCT: ${order.PCT}
- Địa điểm: ${order.location}
- Người chỉ huy: ${order.userId?.name || ''}
- Trạng thái: ${order.status}

Nhóm công tác (Nhân viên):
${(order.NV || []).map((nv, i) => `${i + 1}. ${nv.name}`).join('\n')}

Danh sách dụng cụ đã mượn:
${tools.map((t, i) => `${i + 1}. ${t.name} (Hãng: ${t.manufacturer}, Loại: ${t.type}, Trạng thái mượn: ${t.status === 2 ? 'Đang mượn' : 'Đã trả'})`).join('\n')}

Ký tên:
- Bên Giao: _________________
- Bên Nhận (Chỉ huy trực tiếp): _________________
    `;

    const blob = new Blob([docText], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BienBan_WO_${order.WO}.txt`;
    link.click();
  };

  if (loading || !order) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
        <p className="mt-4 text-slate-500 text-sm">Đang tải chi tiết Work Order...</p>
      </div>
    );
  }

  // Determine verify button settings
  const getVerifyButton = () => {
    switch (order.status) {
      case 'START':
        return { label: 'Xác minh (START -> READY)', icon: Play, color: 'bg-emerald-600 hover:bg-emerald-500' };
      case 'READY':
        return { label: 'Bắt đầu mượn (READY -> IN PROGRESS)', icon: Play, color: 'bg-amber-600 hover:bg-amber-500' };
      case 'IN PROGRESS':
      case 'INPRG HAVE TOOL':
        return { label: 'Chuyển sang trả tool (-> INPRG NO TOOL)', icon: ArrowLeftRight, color: 'bg-orange-600 hover:bg-orange-500' };
      case 'INPRG NO TOOL':
        return { label: 'Hoàn thành công việc (-> COMPLETE)', icon: Check, color: 'bg-teal-600 hover:bg-teal-500' };
      case 'COMPLETE':
        if (user.pkt || user.admin) {
          return { label: 'Đóng Work Order (-> CLOSE)', icon: Lock, color: 'bg-slate-700 hover:bg-slate-600' };
        }
        return null;
      default:
        return null;
    }
  };

  const verifyBtn = getVerifyButton();

  return (
    <div className="space-y-6">
      
      {/* Top Bar Navigation */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => router.push('/admin/order')}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-xs font-semibold text-slate-400">CHI TIẾT PHIẾU CÔNG TÁC</span>
          <h2 className="text-xl font-bold text-slate-800">WO: {order.WO} / PCT: {order.PCT}</h2>
        </div>
      </div>

      {/* Action Controls Panel */}
      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        
        {verifyBtn && (
          <button
            onClick={handleVerifyState}
            className={`flex items-center gap-2 ${verifyBtn.color} text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md`}
          >
            <verifyBtn.icon className="h-4.5 w-4.5" />
            {verifyBtn.label}
          </button>
        )}

        <button
          onClick={handleExportDoc}
          className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all shadow-sm"
        >
          <Download className="h-4.5 w-4.5 text-blue-500" />
          XUẤT BIÊN BẢN BÀN GIAO
        </button>

        {order.status === 'START' && (
          <button
            onClick={() => setAddToolsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md shadow-blue-600/10 ml-auto"
          >
            <Wrench className="h-4.5 w-4.5" />
            THÊM DỤNG CỤ VÀO PHIẾU
          </button>
        )}
      </div>

      {/* Main Info Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Order Main Details */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 lg:col-span-2">
          
          <h3 className="font-bold text-slate-800 text-md border-b border-slate-100 pb-3">
            Nội dung công tác & Địa điểm
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl">
              <MapPin className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Địa điểm làm việc</span>
                <p className="font-semibold text-slate-700 text-sm">{order.location}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl">
              <Settings className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Hệ thống / Mã KKS</span>
                <p className="font-semibold text-slate-700 text-sm">{order.KKS || 'Không xác định'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl">
              <Calendar className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Thời gian thực hiện</span>
                <p className="font-semibold text-slate-700 text-sm">
                  {moment(order.timeStart).format('DD/MM/YYYY')} - {moment(order.timeStop).format('DD/MM/YYYY')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl">
              <UserIcon className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Người chỉ huy trực tiếp</span>
                <p className="font-semibold text-slate-700 text-sm">
                  {order.userId?.name} ({order.userId?.department || 'Cán bộ kỹ thuật'})
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Chi tiết công việc</span>
            <div className="bg-slate-50 p-4 rounded-xl text-slate-700 text-sm whitespace-pre-wrap leading-relaxed border border-slate-100">
              {order.content}
            </div>
          </div>

          {/* Tools Attached Table */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-md">Danh sách công cụ đã mượn ({tools.length})</h3>
            </div>

            {tools.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm">
                <Wrench className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                Chưa có dụng cụ nào được gắn vào phiếu công tác này
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Tên dụng cụ</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Trạng thái mượn</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Hãng</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {tools.map(tool => (
                      <tr key={tool._id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-semibold text-slate-800">{tool.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {tool.status === 2 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Đang sử dụng
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Đã trả về kho
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500">{tool.manufacturer}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            {tool.status === 2 && (order.status === 'READY' || order.status === 'IN PROGRESS' || order.status.startsWith('INPRG')) && (
                              <button
                                onClick={() => handleReturnTool(tool)}
                                className="flex items-center gap-1 py-1 px-2.5 rounded-lg border border-slate-200 text-amber-600 hover:bg-amber-50 font-semibold text-xs transition-colors"
                              >
                                <ArrowLeftRight className="h-3 w-3" /> TRẢ KHO
                              </button>
                            )}
                            {order.status === 'START' && (
                              <button
                                onClick={() => handleRemoveToolFromOrder(tool)}
                                className="p-1.5 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50 transition-colors"
                                title="Gỡ khỏi WO"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Team Members & Safety */}
        <div className="space-y-6">
          
          {/* Status Details */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-md border-b border-slate-100 pb-3 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-500" /> Trạng thái vận hành
            </h3>
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Trạng thái hiện tại</span>
              <div>
                <span className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-bold border ${
                  order.status === 'START' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                  order.status === 'READY' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  order.status.startsWith('INPRG') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  order.status === 'COMPLETE' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                  'bg-slate-100 text-slate-800 border-slate-300'
                }`}>
                  {order.status}
                </span>
              </div>
            </div>
          </div>

          {/* Team Members List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-md border-b border-slate-100 pb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" /> Nhân viên nhóm công tác
            </h3>

            {/* Add member input */}
            {(order.status === 'START' || order.status === 'READY') && (
              <form onSubmit={handleAddMember} className="flex gap-2">
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Họ tên nhân viên..."
                />
                <button
                  type="submit"
                  className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </form>
            )}

            {/* Members List */}
            {(!order.NV || order.NV.length === 0) ? (
              <p className="text-slate-400 text-sm text-center py-6 italic">Chưa có nhân viên nào trong nhóm</p>
            ) : (
              <div className="space-y-2">
                {order.NV.map((member, index) => (
                  <div key={index} className="flex justify-between items-center bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 text-sm">
                    <span className="font-semibold text-slate-700">{index + 1}. {member.name}</span>
                    {(order.status === 'START' || order.status === 'READY') && (
                      <button 
                        onClick={() => handleRemoveMember(index)}
                        className="text-red-500 hover:text-red-700 p-0.5"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Add Tools Modal */}
      {addToolsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-slate-100 overflow-hidden animate-scale-in">
            
            {/* Modal Header */}
            <div className="h-14 flex items-center justify-between px-6 border-b border-slate-100 bg-slate-50">
              <h4 className="font-bold text-slate-800 text-sm uppercase">Thêm dụng cụ vào Work Order</h4>
              <button onClick={() => setAddToolsModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-200 text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              
              {/* Tool Search filters inside modal */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <input
                  type="text"
                  value={searchToolName}
                  onChange={(e) => setSearchToolName(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                  placeholder="Tên dụng cụ..."
                />
                <input
                  type="text"
                  value={searchToolManufacturer}
                  onChange={(e) => setSearchToolManufacturer(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                  placeholder="Hãng..."
                />
                <input
                  type="text"
                  value={searchToolType}
                  onChange={(e) => setSearchToolType(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                  placeholder="Loại..."
                />
              </div>

              {/* Tools List */}
              <div className="max-h-[50vh] overflow-y-auto space-y-2 border border-slate-200 rounded-xl divide-y divide-slate-100">
                {availableTools.length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-12 italic">Không tìm thấy dụng cụ nào sẵn có trong kho</p>
                ) : (
                  availableTools.map(tool => (
                    <div key={tool._id} className="flex justify-between items-center p-3 hover:bg-slate-50/50">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{tool.name}</p>
                        <p className="text-xs text-slate-400">Hãng: {tool.manufacturer} | Phân loại: {tool.type}</p>
                      </div>
                      <button
                        onClick={() => handleAddToolToOrder(tool)}
                        disabled={addingTool}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-all shadow-sm"
                      >
                        <Plus className="h-3.5 w-3.5" /> THÊM
                      </button>
                    </div>
                  ))
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="h-14 flex items-center justify-end px-6 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setAddToolsModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-100"
              >
                ĐÓNG
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
