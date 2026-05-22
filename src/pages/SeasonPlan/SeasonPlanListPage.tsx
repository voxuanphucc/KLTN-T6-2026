import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth';
import { useSeasonPlans } from '../../hooks/seasonPlans/useSeasonPlans';
import { useCrops } from '../../hooks/crops/useCrops';
import { SeasonPlan } from '../../types/seasonPlan';
import { calculatePlanProgress, canEditPlan } from '../../utils/seasonPlanUtils';
import { Search, Calendar, Loader2, Info, CheckCircle2, AlertCircle, Trash2, ArrowLeft } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { cn } from '../../utils/cn';
import { Button } from '../../components/ui/button';
import { CreatePlanModal } from '@/components/season-plan/CreatePlanModal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Navigate } from 'react-router-dom';
import { getRolesFromToken } from '../../utils/jwt';
import { getStatusColor } from '@/components/season-plan/detail/DetailCommon';

export function SeasonPlanListPage() {
  const navigate = useNavigate();
  const { farmId } = useParams<{ farmId: string }>();
  const { currentFarmId, user, accessToken } = useAuth();
  const { plans, loading, error, fetchPlans, createPlan, deletePlan: removePlan, fetchStages, fetchTasks } = useSeasonPlans(farmId);
  const { fetchCrops, allCrops } = useCrops();

  // Kiểm tra quyền
  const canEdit = canEditPlan(user?.role, accessToken);

  // Redirect if no farm context (non-admin users)
  if (!currentFarmId && !(accessToken && getRolesFromToken(accessToken).includes('ROLE_ADMIN'))) {
    return <Navigate to="/farms" replace />;
  }

  useEffect(() => {
    const loadData = async () => {
      if (accessToken) {
        try {
          fetchCrops();
          const fetchedPlans = await fetchPlans();
          if (fetchedPlans && Array.isArray(fetchedPlans)) {
            // Fetch stages for each plan
            await Promise.allSettled(fetchedPlans.map(async (plan) => {
              const stagesResult = await fetchStages(plan.id);
              if (stagesResult && stagesResult.phases) {
                // Fetch tasks for each phase to calculate accurate progress
                await Promise.allSettled(
                  stagesResult.phases.map(phase => fetchTasks(plan.id, phase.id))
                );
              }
            }));
          }
        } catch (err) {
          console.error('[SeasonPlanListPage] Failed to load plans, stages or tasks:', err);
        }
      }
    };
    loadData();
  }, [fetchPlans, fetchStages, fetchTasks, fetchCrops, accessToken]);

  const farmPlans = plans.filter((p: SeasonPlan) => p.farmId === currentFarmId || p.farmId === '');

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Notification Modal state
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
    details?: string[];
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    planId: string | null;
    isDeleting: boolean;
  }>({
    isOpen: false,
    planId: null,
    isDeleting: false
  });

  useEffect(() => {
    if (isCreateModalOpen) {
      fetchCrops();
    }
  }, [isCreateModalOpen, fetchCrops]);

  const filteredPlans = farmPlans.filter((p: SeasonPlan) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleCreatePlan = async (newPlanData: any) => {
    console.log('[SeasonPlanListPage] handleCreatePlan called with:', newPlanData);
    try {
      await createPlan(newPlanData).unwrap();
      console.log('[SeasonPlanListPage] createPlan succeeded');
      // The modal handles its own closing on success
    } catch (err: any) {
      console.error('[SeasonPlanListPage] createPlan failed:', err);
      let errorMsg = 'Dữ liệu không hợp lệ. Hãy kiểm tra lại thời gian bắt đầu/kết thúc.';
      let details: string[] = [];

      if (err && typeof err === 'object') {
        if (err.message) errorMsg = err.message;
        if (err.data && typeof err.data === 'object') {
          details = Object.entries(err.data).map(([key, val]: [string, any]) => `${key}: ${val}`);
        }
      } else if (typeof err === 'string') {
        errorMsg = err;
      }

      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Lỗi tạo kế hoạch',
        message: errorMsg,
        details: details.length > 0 ? details : undefined
      });

      // Re-throw to let the modal know it failed
      throw err;
    }
  };

  const handleDeletePlan = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirm({
      isOpen: true,
      planId: id,
      isDeleting: false
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.planId) return;

    setDeleteConfirm(prev => ({ ...prev, isDeleting: true }));
    try {
      await removePlan(deleteConfirm.planId).unwrap();
      setDeleteConfirm({ isOpen: false, planId: null, isDeleting: false });
    } catch (err: any) {
      setDeleteConfirm(prev => ({ ...prev, isDeleting: false, isOpen: false }));
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Lỗi xóa kế hoạch',
        message: typeof err === 'string' ? err : 'Không thể xóa kế hoạch này'
      });
    }
  };


  const formatDate = (dateStr: string) => {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/farms/${currentFarmId}/actions`)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-all font-bold text-xs shrink-0"
          >
            <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center">
              <ArrowLeft size={14} />
            </div>
            Quay lại
          </button>
          <div className="h-8 w-px bg-slate-200 mx-2" />
          <div className="flex-1 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kế hoạch mùa vụ</h1>
              <p className="text-sm text-slate-500 mt-0.5">Danh sách các mùa vụ của trang trại</p>
            </div>
            <div className="flex items-center gap-3">
              {canEdit ? (
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 transition-all font-bold px-6"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  + Tạo vụ mùa
                </Button>
              ) : (
                <div className="px-4 py-2 bg-slate-100 rounded-xl flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  <Info size={14} />
                  Chế độ chỉ xem
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm mùa vụ..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

        </div>
      </div>

      {/* Season Cards Grid */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Loader2 size={48} className="mb-4 animate-spin text-indigo-500" />
            <p className="text-lg font-medium">Đang tải kế hoạch...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-red-500">
            <p className="text-lg font-medium">Lỗi khi tải dữ liệu</p>
            <p className="text-sm">{typeof error === 'string' ? error : JSON.stringify(error)}</p>
            <Button
              variant="outline"
              className="mt-4 border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => fetchPlans()}
            >
              Thử lại
            </Button>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Calendar size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">Chưa có mùa vụ nào</p>
            <p className="text-sm">Tạo mùa vụ đầu tiên để bắt đầu</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlans.map((plan) => (
              (() => {
                const progressPercent = calculatePlanProgress(plan);
                const cropName = allCrops.find(c => c.id === plan.cropId)?.name || (plan as any).cropName;


                return (
                  <div
                    key={plan.id}
                    onClick={() => navigate(`/farms/${currentFarmId}/season-plans/${plan.id}`)}
                    className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100/50 transition-all group flex flex-col h-full"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <h3 className="text-[16px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 flex-1">
                        {plan.name}
                      </h3>
                      {canEdit && (
                        <button
                          onClick={(e) => handleDeletePlan(e, plan.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all shrink-0"
                          title="Xóa kế hoạch"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col gap-3">
                      {/* Badge row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {cropName && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold uppercase tracking-wider">
                            {cropName}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                          <Calendar size={10} /> {formatDate(plan.startDate)} – {formatDate(plan.endDate)}
                        </span>
                      </div>

                      {/* Progress */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-bold">
                          {/* <span className="text-slate-400 uppercase tracking-widest">Tiến độ</span>
                          <span className="text-indigo-600 font-black">
                            {progressPercent}%
                          </span> */}
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200/50">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${progressPercent}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1.5">
                          {(plan.phases || []).slice(0, 3).map((phase, idx) => {
                            const color = getStatusColor(phase.status);
                            return (
                              <div
                                key={phase.id}
                                className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[7px] font-bold text-white shadow-sm"
                                style={{ backgroundColor: color.startsWith('bg-') ? undefined : color }}
                              >
                                {idx + 1}
                              </div>
                            );
                          })}
                          {(plan.phases || []).length > 3 && (
                            <div className="w-5 h-5 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[7px] font-bold text-slate-600">
                              +{(plan.phases || []).length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-[11px] font-black uppercase tracking-wider text-indigo-600 group-hover:text-indigo-700 flex items-center gap-0.5">
                        Chi tiết
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })()
            ))}
          </div>
        )}
      </div>

      <CreatePlanModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreatePlan}
      />

      {/* Notification Modal */}
      <Modal
        isOpen={notification.isOpen}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
      >
        <div className="bg-white rounded-[32px] p-8 w-full max-w-sm overflow-hidden border border-slate-100 shadow-2xl">
          <div className="flex flex-col items-center text-center">
            <div className={cn(
              "w-20 h-20 rounded-3xl flex items-center justify-center mb-6",
              notification.type === 'success' ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
            )}>
              {notification.type === 'success' ? <CheckCircle2 size={40} /> : <AlertCircle size={40} />}
            </div>

            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">
              {notification.title}
            </h3>

            <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
              {notification.message}
            </p>

            {notification.details && notification.details.length > 0 && (
              <div className="w-full bg-slate-50 rounded-2xl p-4 mb-6 text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Chi tiết lỗi:</p>
                <ul className="space-y-1">
                  {notification.details.map((detail, idx) => (
                    <li key={idx} className="text-xs text-rose-600 font-bold flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              onClick={() => setNotification(prev => ({ ...prev, isOpen: false }))}
              className={cn(
                "w-full py-6 rounded-2xl font-black uppercase tracking-wider text-white border-none shadow-lg",
                notification.type === 'success' ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100" : "bg-slate-900 hover:bg-slate-800 shadow-slate-100"
              )}
            >
              Đóng
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDelete}
        loading={deleteConfirm.isDeleting}
        title="Xóa kế hoạch?"
        message="Bạn có chắc chắn muốn xóa kế hoạch mùa vụ này? Mọi dữ liệu liên quan sẽ bị loại bỏ vĩnh viễn."
        confirmLabel="Xóa ngay"
        type="danger"
      />
    </div>
  );
}

export default SeasonPlanListPage;
