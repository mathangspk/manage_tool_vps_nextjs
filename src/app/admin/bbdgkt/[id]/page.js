'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { bbdgktsApi, filesApi } from '../../../../lib/api';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, FileText, Calendar, User as UserIcon, 
  Trash2, ExternalLink, Paperclip, Loader2, Save, Info
} from 'lucide-react';
import moment from 'moment';

export default function BbdgktDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useParams();
  const [bbdgkt, setBbdgkt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingNote, setSavingNote] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Editable fields
  const [note, setNote] = useState('');

  const fetchBbdgktDetails = async () => {
    setLoading(true);
    try {
      const data = await bbdgktsApi.getBbdgktById(id);
      if (data) {
        setBbdgkt(data);
        setNote(data.note || '');
      }
    } catch (error) {
      console.error('Error fetching BBDGKT details:', error);
      alert('Không tìm thấy Biên bản ĐGKT này.');
      router.push('/admin/bbdgkt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchBbdgktDetails();
    }
  }, [id]);

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      const bbdgktData = {
        WO: bbdgkt.WO,
        content: bbdgkt.content,
        time: bbdgkt.time,
        note: note,
        userId: bbdgkt.userId?._id || user._id,
      };
      await bbdgktsApi.updateBbdgkt(id, bbdgktData);
      // Refresh
      const data = await bbdgktsApi.getBbdgktById(id);
      if (data) setBbdgkt(data);
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

    setUploading(true);
    try {
      const uploadRes = await filesApi.uploadFiles(formData);
      if (uploadRes && uploadRes.status && uploadRes.data) {
        // Append new files to the list
        const newFilesList = [...(bbdgkt.files || []), ...uploadRes.data];
        
        // Save to BBDGKT
        await filesApi.addFilesToBbdgkt(id, newFilesList);
        
        // Refresh
        const data = await bbdgktsApi.getBbdgktById(id);
        if (data) setBbdgkt(data);
      } else {
        alert('Tải tệp tin lên thất bại.');
      }
    } catch (error) {
      console.error('File upload error:', error);
      alert('Lỗi khi tải tệp tin lên Google Drive.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = async (fileObj) => {
    if (!confirm(`Bạn có chắc chắn muốn gỡ bỏ tài liệu "${fileObj.name}"?`)) return;
    try {
      // 1. Delete from Google Drive
      await filesApi.deleteFile(fileObj.idFile);
      
      // 2. Remove reference from BBDGKT
      const newFilesList = (bbdgkt.files || []).filter(f => f._id !== fileObj._id);
      await filesApi.addFilesToBbdgkt(id, newFilesList);
      
      // Refresh
      const data = await bbdgktsApi.getBbdgktById(id);
      if (data) setBbdgkt(data);
    } catch (error) {
      console.error('File deletion error:', error);
      alert('Có lỗi xảy ra khi gỡ bỏ tài liệu.');
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
        <p className="mt-4 text-slate-500 text-sm">Đang tải chi tiết Biên bản ĐGKT...</p>
      </div>
    );
  }

  if (!bbdgkt) return null;

  const isAuthor = user?.admin || user?._id === bbdgkt.userId?._id;

  return (
    <div className="space-y-6">
      
      {/* Header action */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <button
          onClick={() => router.push('/admin/bbdgkt')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold py-2 px-3 rounded-lg border border-slate-200 text-sm transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          QUAY LẠI DANH SÁCH
        </button>

        <h3 className="font-bold text-slate-800 hidden md:block text-sm uppercase">
          Số Biên Bản: {bbdgkt.BBDGKT}
        </h3>
      </div>

      {/* Info Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Metadata */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Thông tin chi tiết biên bản
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Số Biên Bản</span>
                <span className="text-sm font-bold text-slate-800">{bbdgkt.BBDGKT}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Work Order</span>
                <span className="text-sm font-bold text-blue-600">{bbdgkt.WO}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Ngày thực hiện</span>
                <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {moment(bbdgkt.time).format('DD/MM/YYYY')}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Phân xưởng / Nhóm</span>
                <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <UserIcon className="h-4 w-4 text-slate-400" />
                  {bbdgkt.userId?.department || 'Chưa phân nhóm'}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl">
              <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nội dung công tác</span>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{bbdgkt.content}</p>
            </div>
          </div>

          {/* Editable Note */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Info className="h-5 w-5 text-amber-500" />
                Ghi chú nội bộ
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
              placeholder={isAuthor ? "Nhập ghi chú cho Biên bản ĐGKT này..." : "Không có ghi chú nào"}
              className="w-full min-h-[100px] p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-70"
            />
          </div>
        </div>

        {/* Right Column: Files & Attachments */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Paperclip className="h-5 w-5 text-emerald-500" />
              Tài liệu đính kèm ({bbdgkt.files?.length || 0})
            </h3>

            {/* Upload form */}
            {isAuthor && (
              <div className="border border-dashed border-slate-200 p-4 rounded-xl text-center hover:bg-slate-50/50 transition-colors relative">
                {uploading ? (
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
                    <p className="text-xs font-semibold text-slate-600">Click để chọn tài liệu</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Tải tệp trực tiếp lên thư mục Google Drive</p>
                  </>
                )}
              </div>
            )}

            {/* List of files */}
            {(!bbdgkt.files || bbdgkt.files.length === 0) ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Chưa có tài liệu đính kèm
              </div>
            ) : (
              <div className="space-y-2">
                {bbdgkt.files.map(fileObj => (
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
                        title="Xem trên Google Drive"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      {isAuthor && (
                        <button
                          onClick={() => handleRemoveFile(fileObj)}
                          className="p-1.5 bg-white border border-slate-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          title="Gỡ tài liệu"
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
