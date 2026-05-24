'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { fastReportsApi, filesApi } from '../../../../lib/api';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, FileText, Calendar, User as UserIcon, 
  Trash2, ExternalLink, Paperclip, Loader2, Save, Info,
  Image as ImageIcon, MapPin, Settings, ShieldAlert, Sparkles
} from 'lucide-react';
import moment from 'moment';

export default function FastReportDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingNote, setSavingNote] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Editable fields
  const [note, setNote] = useState('');

  const fetchReportDetails = async () => {
    setLoading(true);
    try {
      const data = await fastReportsApi.getReportById(id);
      if (data) {
        setReport(data);
        setNote(data.note || '');
      }
    } catch (error) {
      console.error('Error fetching fast report details:', error);
      alert('Không tìm thấy Báo cáo nhanh này.');
      router.push('/admin/fastReport');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchReportDetails();
    }
  }, [id]);

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      const reportData = {
        ...report,
        userId: report.userId?._id || user._id,
        note: note,
      };
      await fastReportsApi.updateReport(id, reportData);
      const data = await fastReportsApi.getReportById(id);
      if (data) setReport(data);
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Không thể lưu ghi chú.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleFileUpload = async (e) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append('files', selectedFiles[i]);
    }

    setUploadingDoc(true);
    try {
      const uploadRes = await filesApi.uploadFiles(formData);
      if (uploadRes && uploadRes.status && uploadRes.data) {
        const newFilesList = [...(report.files || []), ...uploadRes.data];
        
        // Save to Fast Report
        await filesApi.addFilesToFastReport(id, newFilesList);
        
        // Refresh
        const data = await fastReportsApi.getReportById(id);
        if (data) setReport(data);
      } else {
        alert('Tải tài liệu lên thất bại.');
      }
    } catch (error) {
      console.error('Document upload error:', error);
      alert('Lỗi khi tải tài liệu lên Google Drive.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleRemoveFile = async (fileObj) => {
    if (!confirm(`Bạn có chắc chắn muốn gỡ bỏ tài liệu "${fileObj.name}"?`)) return;
    try {
      await filesApi.deleteFile(fileObj.idFile);
      
      const newFilesList = (report.files || []).filter(f => f._id !== fileObj._id);
      await filesApi.addFilesToFastReport(id, newFilesList);
      
      const data = await fastReportsApi.getReportById(id);
      if (data) setReport(data);
    } catch (error) {
      console.error('File deletion error:', error);
      alert('Có lỗi xảy ra khi gỡ bỏ tài liệu.');
    }
  };

  const handleImageUpload = async (e) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append('photo', selectedFiles[i]);
    }

    setUploadingImage(true);
    try {
      const uploadRes = await filesApi.uploadPhotos(formData);
      if (uploadRes && uploadRes.status && uploadRes.data) {
        const newImagesList = [...(report.images || []), ...uploadRes.data];
        
        // Update report via PATCH
        const reportData = {
          ...report,
          userId: report.userId?._id || user._id,
          images: newImagesList,
        };
        await fastReportsApi.updateReport(id, reportData);
        
        // Refresh
        const data = await fastReportsApi.getReportById(id);
        if (data) setReport(data);
      } else {
        alert('Tải hình ảnh lên thất bại.');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Lỗi khi tải hình ảnh lên Google Drive.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async (imgObj) => {
    if (!confirm('Bạn có chắc chắn muốn xóa hình ảnh này?')) return;
    try {
      await filesApi.deleteFile(imgObj.idImage);
      
      const newImagesList = (report.images || []).filter(img => img._id !== imgObj._id);
      const reportData = {
        ...report,
        userId: report.userId?._id || user._id,
        images: newImagesList,
      };
      await fastReportsApi.updateReport(id, reportData);
      
      const data = await fastReportsApi.getReportById(id);
      if (data) setReport(data);
    } catch (error) {
      console.error('Image deletion error:', error);
      alert('Có lỗi xảy ra khi xóa hình ảnh.');
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
        <p className="mt-4 text-slate-500 text-sm">Đang tải chi tiết Báo cáo nhanh...</p>
      </div>
    );
  }

  if (!report) return null;

  const isAuthor = user?.admin || user?._id === report.userId?._id;

  return (
    <div className="space-y-6">
      
      {/* Header action */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <button
          onClick={() => router.push('/admin/fastReport')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold py-2 px-3 rounded-lg border border-slate-200 text-sm transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          QUAY LẠI DANH SÁCH
        </button>

        <h3 className="font-bold text-slate-800 hidden md:block text-sm uppercase">
          Mã WO: {report.WO}
        </h3>
      </div>

      {/* Info Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Metadata & Report Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Info */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Chi tiết sự cố & Phương án xử lý
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Work Order</span>
                <span className="text-sm font-bold text-blue-600">{report.WO}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Hệ thống / KKS</span>
                <span className="text-sm font-mono font-bold text-slate-800 flex items-center gap-1.5">
                  <Settings className="h-4 w-4 text-slate-400" />
                  {report.KKS || '-'}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Địa điểm</span>
                <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {report.location}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Thời gian thực hiện</span>
                <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {moment(report.timeStart).format('DD/MM/YYYY')} - {moment(report.timeStop).format('DD/MM/YYYY')}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl">
                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nội dung công tác</span>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{report.content}</p>
              </div>

              <div className="bg-red-50/50 border border-red-100 p-4 rounded-xl">
                <span className="block text-[10px] font-bold text-red-500 uppercase mb-1 flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5" /> Hiện tượng lỗi / Sự cố
                </span>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{report.error}</p>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl">
                <span className="block text-[10px] font-bold text-emerald-600 uppercase mb-1 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> Kết quả xử lý & Khắc phục
                </span>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{report.result || 'Chưa cập nhật phương án xử lý'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <div>
                Tạo bởi: <span className="font-bold text-slate-700">{report.userId?.name}</span> ({report.userId?.department || 'PVPS'})
              </div>
              <div>
                Nhân sự xử lý: <span className="font-bold text-slate-700">{report.employ || '-'}</span>
              </div>
            </div>
          </div>

          {/* Editable Note */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Info className="h-5 w-5 text-amber-500" />
                Ghi chú / Nhận xét thêm
              </h3>
              {isAuthor && (
                <button
                  onClick={handleSaveNote}
                  disabled={savingNote}
                  className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 px-3 rounded-lg transition-all"
                >
                  {savingNote ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  LƯU GHI CHÚ
                </button>
              )}
            </div>
            
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={!isAuthor}
              placeholder={isAuthor ? "Nhập ghi chú cho Báo cáo nhanh này..." : "Không có ghi chú nào"}
              className="w-full min-h-[100px] p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-70"
            />
          </div>
        </div>

        {/* Right Column: Images & Files Attachments */}
        <div className="space-y-6">
          
          {/* Images Gallery */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-indigo-500" />
              Hình ảnh hiện trường
            </h3>

            {/* Photo upload form */}
            {isAuthor && (
              <div className="border border-dashed border-slate-200 p-4 rounded-xl text-center hover:bg-slate-50/50 transition-colors relative">
                {uploadingImage ? (
                  <div className="py-2">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto" />
                    <p className="mt-1 text-slate-500 text-xs">Đang tải ảnh lên Google Drive...</p>
                  </div>
                ) : (
                  <>
                    <input 
                      type="file" 
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <ImageIcon className="h-6 w-6 text-slate-400 mx-auto mb-1.5" />
                    <p className="text-xs font-semibold text-slate-600">Thêm hình ảnh sự cố</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Tệp ảnh định dạng JPG, PNG...</p>
                  </>
                )}
              </div>
            )}

            {/* Images display */}
            {(!report.images || report.images.length === 0) ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Chưa có hình ảnh sự cố nào
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {report.images.map(img => (
                  <div key={img._id} className="relative group overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
                    <img 
                      src={`https://drive.google.com/uc?export=view&id=${img.idImage}`}
                      alt="Hiện tượng sự cố"
                      className="w-full h-28 object-cover group-hover:scale-105 transition-all duration-200"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <a 
                        href={`https://drive.google.com/file/d/${img.idImage}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-white text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      {isAuthor && (
                        <button
                          onClick={() => handleRemoveImage(img)}
                          className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Document Attachments */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Paperclip className="h-5 w-5 text-emerald-500" />
              Tài liệu đính kèm ({report.files?.length || 0})
            </h3>

            {/* Document upload form */}
            {isAuthor && (
              <div className="border border-dashed border-slate-200 p-4 rounded-xl text-center hover:bg-slate-50/50 transition-colors relative">
                {uploadingDoc ? (
                  <div className="py-2">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto" />
                    <p className="mt-1 text-slate-500 text-xs">Đang tải lên Google Drive...</p>
                  </div>
                ) : (
                  <>
                    <input 
                      type="file" 
                      multiple
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Paperclip className="h-6 w-6 text-slate-400 mx-auto mb-1.5" />
                    <p className="text-xs font-semibold text-slate-600">Thêm tài liệu kỹ thuật</p>
                  </>
                )}
              </div>
            )}

            {/* Document list */}
            {(!report.files || report.files.length === 0) ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Chưa có tài liệu đính kèm
              </div>
            ) : (
              <div className="space-y-2">
                {report.files.map(fileObj => (
                  <div key={fileObj._id} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl bg-slate-50 hover:bg-slate-100/50 transition-all gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-700 truncate" title={fileObj.name}>
                        {fileObj.name}
                      </p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <a
                        href={`https://drive.google.com/file/d/${fileObj.idFile}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-white border border-slate-200 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      {isAuthor && (
                        <button
                          onClick={() => handleRemoveFile(fileObj)}
                          className="p-1.5 bg-white border border-slate-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
