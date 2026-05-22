import React from 'react';
import {
  Bug,
  Plus,
  ChevronRight
} from 'lucide-react';

import { useDiseaseReports } from '@/hooks/diseaseReport/useDiseaseReports';
import { diseaseReportService } from '@/services/diseaseReport/diseaseReportService';
import { Loader2 } from 'lucide-react';
import { CreateDiseaseReportModal } from './CreateDiseaseReportModal';
import { DiseaseReportDetailModal } from './DiseaseReportDetailModal';
import type { DiseaseReportResponse } from '@/types/diseaseReport/diseaseReport';

// Mapping report status to Vietnamese
const reportStatusMap: Record<string, string> = {
  'QUEUED': 'Chờ xử lý',
  'IN_PROGRESS': 'Đang xử lý',
  'DONE': 'Đã xử lý',
  'FAILED': 'Thất bại',
  'CANCELLED': 'Đã hủy'
};

const getReportStatusInVietnamese = (status: string): string => {
  return reportStatusMap[status] || status;
};

export const PestDiseaseReportPage: React.FC = () => {
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(10);
  const [sort, setSort] = React.useState<string[]>(['createdAt,desc']);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [selectedReport, setSelectedReport] = React.useState<DiseaseReportResponse | null>(null);
  const [loadingDiagnosis, setLoadingDiagnosis] = React.useState(false);

  const { reports, pageData, loading } = useDiseaseReports(page, size, sort);

  const handleSelectReport = async (report: DiseaseReportResponse) => {
    setSelectedReport(report);
    
    // If diagnosisId exists, fetch diagnosis details
    if (report.diagnosisId) {
      setLoadingDiagnosis(true);
      try {
        const diagnosisResponse = await diseaseReportService.getDiagnosisDetails(report.diagnosisId);
        if (diagnosisResponse.data) {
          // Merge diagnosis data with report data
          setSelectedReport({
            ...report,
            diagnosisDetails: diagnosisResponse.data
          } as any);
        }
      } catch (error) {
        console.error('Failed to fetch diagnosis details:', error);
      } finally {
        setLoadingDiagnosis(false);
      }
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shadow-inner">
              <Bug size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                Lịch sử báo cáo sâu bệnh
              </h1>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Theo dõi và quản lý các vấn đề dịch hại tại trang trại
              </p>
            </div>
          </div>
        </div>

      </div>



      {/* Main Table Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Lô đất</th>
                <th className="px-6 py-4">Cây trồng</th>
                <th className="px-6 py-4">Chi tiết bệnh hại</th>
                <th className="px-6 py-4">Tỉ lệ ảnh hưởng</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto" />
                    <p className="mt-2 text-sm text-slate-500">Đang tải dữ liệu báo cáo...</p>
                  </td>
                </tr>
              ) : reports.length > 0 ? (
                reports.map((report) => (
                  <tr 
                    key={report.id} 
                    onClick={() => handleSelectReport(report)}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-sm text-slate-700">{report.plot?.name || 'Không xác định'}</div>
                      {report.plot?.status && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          {report.plot.status === 'ACTIVE' ? 'Đang hoạt động' : report.plot.status === 'INACTIVE' ? 'Ngừng hoạt động' : report.plot.status}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-sm text-slate-700">{report.crop?.name || 'Không xác định'}</div>
                      {report.crop?.cropType && (
                        <div className="text-xs text-slate-500 mt-0.5 max-w-[200px] truncate" title={report.crop.cropType.description}>
                          {report.crop.cropType.name} - {report.crop.cropType.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-sm text-slate-700 line-clamp-1" title={report.description}>
                        {report.description || 'Không có mô tả'}
                      </div>
                      {report.locationNotes && (
                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-1" title={report.locationNotes}>
                          Vị trí: {report.locationNotes}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-md border border-red-100">
                        {report.affectedPercent}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {report.status === 'QUEUED' && <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-yellow-100 text-yellow-700">{getReportStatusInVietnamese('QUEUED')}</span>}
                      {report.status === 'IN_PROGRESS' && <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-100 text-blue-700">{getReportStatusInVietnamese('IN_PROGRESS')}</span>}
                      {report.status === 'COMPLETED' && <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-green-100 text-green-700">{getReportStatusInVietnamese('COMPLETED')}</span>}
                      {report.status === 'FAILED' && <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-red-100 text-red-700">{getReportStatusInVietnamese('FAILED')}</span>}
                      {!['QUEUED', 'IN_PROGRESS', 'COMPLETED', 'FAILED'].includes(report.status) && (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">{getReportStatusInVietnamese(report.status)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-slate-500">
                          {new Date(report.createdAt).toLocaleDateString('vi-VN')} {new Date(report.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                          <ChevronRight size={18} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                        <Bug size={32} className="text-slate-300" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">Chưa có dữ liệu báo cáo</p>
                    
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-slate-500">
                Hiển thị <span className="text-slate-800">{reports.length}</span> / {pageData?.totalElements || 0} báo cáo
              </p>
              <select
                value={size}
                onChange={(e) => {
                  setSize(Number(e.target.value));
                  setPage(0);
                }}
                className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                <option value={10}>10 dòng</option>
                <option value={20}>20 dòng</option>
                <option value={50}>50 dòng</option>
              </select>
            </div>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
              <p className="text-xs font-semibold text-slate-500">Sắp xếp:</p>
              <select
                value={sort[0]}
                onChange={(e) => {
                  setSort([e.target.value]);
                  setPage(0);
                }}
                className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                <option value="createdAt,desc">Ngày tạo (Mới nhất)</option>
                <option value="createdAt,asc">Ngày tạo (Cũ nhất)</option>
                <option value="affectedPercent,desc">Mức độ ảnh hưởng (Cao nhất)</option>
                <option value="affectedPercent,asc">Mức độ ảnh hưởng (Thấp nhất)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Trước
            </button>
            <span className="px-3 text-sm font-semibold text-slate-600">Trang {page + 1} / {pageData?.totalPages || 1}</span>
            <button
              disabled={!pageData || page >= pageData.totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Tiếp
            </button>
          </div>
        </div>
      </div>

      <CreateDiseaseReportModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <DiseaseReportDetailModal
        isOpen={!!selectedReport}
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </div>
  );
};

export default PestDiseaseReportPage;
