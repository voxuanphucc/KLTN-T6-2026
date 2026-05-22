import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFarms } from '@/hooks/farms/useFarms';
import { usePlots } from '@/hooks/plots/usePlots';
import { useCrops } from '@/hooks/crops/useCrops';
import { useAuth } from '@/hooks/auth/useAuth';
import { useSeasonPlans } from '@/hooks/seasonPlans/useSeasonPlans';
import { useMembers } from '@/hooks/members/useMembers';
import { EditFarmModal } from '../../components/farm/EditFarmModal';
import { toast } from 'sonner';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { 
  Map, 
  Grid3X3, 
  Zap, 
  Warehouse, 
  ArrowRight,
} from 'lucide-react';

import { extractErrorMessage } from '../../utils/errorUtils';

// New Components
import DashboardHeader from '../../components/farm/DashboardHeader';
import QuickStats from '../../components/farm/QuickStats';
import WelcomeSection from '../../components/farm/WelcomeSection';
import FarmInfoSection from '../../components/farm/FarmInfoSection';

const FarmActionsPage: React.FC = () => {
    const { farmId } = useParams<{ farmId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { farmSummary, farms, fetchFarms, fetchFarmsSummary, deleteFarm, loading: loadingFarms } = useFarms();
    const { plots, plotsLoading } = usePlots();
    const { systemCrops, systemCropsLoading } = useCrops(farmId);
    const { plans, fetchStages, loading: loadingPlans } = useSeasonPlans(farmId);
    const { members, fetchMembers, loadingMembers } = useMembers();

    useEffect(() => {
        if (farmId === 'null' || !farmId) {
            navigate('/farms', { replace: true });
        }
    }, [farmId, navigate]);

    // Tự động fetch stages cho tất cả plans để có dữ liệu tiến trình thực tế
    useEffect(() => {
        if (plans.length > 0) {
            plans.forEach(plan => {
                if (!plan.phases || plan.phases.length === 0) {
                    fetchStages(plan.id);
                }
            });
        }
    }, [plans, fetchStages]);

    useEffect(() => {
        if (farms.length === 0) {
            fetchFarms();
        }
    }, [farms.length, fetchFarms]);

    useEffect(() => {
        if (farmId && farmId !== 'null') {
            fetchMembers(farmId);
        }
    }, [farmId, fetchMembers]);


    // Ưu tiên tìm trong list 'farms' (full detail) để có description
    const farm = (farms.find((f) => f.id === farmId) as any) ||
        (farmSummary.find((f) => f.farmId === farmId) as any);

    const farmName = farm?.farmName || farm?.name || 'Trang Trại';
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleDelete = async () => {
        if (!farmId) return;

        setIsDeleting(true);
        try {
            await deleteFarm(farmId).unwrap();
            toast.success("Xóa trang trại thành công");
            navigate('/farms');
        } catch (error: any) {
            console.error("Lỗi khi xóa farm:", error);
            toast.error(extractErrorMessage(error));
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
        }
    };

    if (!farm) {
        if (loadingFarms) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-emerald-100 rounded-full"></div>
                        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="mt-6 text-gray-500 font-medium animate-pulse">Đang tải thông tin trang trại...</p>
                </div>
            );
        }

        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy trang trại</h2>
                <p className="text-gray-500 mb-8 max-w-sm">Dữ liệu không tồn tại hoặc bạn không có quyền truy cập vào trang trại này.</p>
                <button
                    onClick={() => navigate('/farms')}
                    className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                >
                    Quay lại danh sách
                </button>
            </div>
        );
    }

    const canManage = farm?.owner ||
        farm?.ownerId === user?.id ||
        farm?.myRole?.toLowerCase() === 'owner';

    return (
        <div className="min-h-full bg-[#F8FAFC] pb-20 overflow-y-auto no-scrollbar">
            <DashboardHeader
              onEdit={() => setIsEditModalOpen(true)}
              onDelete={() => setIsDeleteModalOpen(true)}
              showActions={canManage}
            />

            <div className="px-8 py-8 space-y-8 max-w-7xl mx-auto">
                {/* Welcome Section */}
                <WelcomeSection farmName={farmName} />

                {/* Compact Stats Grid */}
                <QuickStats
                    plotsCount={plots.length}
                    cropsCount={systemCrops.length}
                    plansCount={plans.length}
                    membersCount={members.length}
                    loading={plotsLoading || systemCropsLoading || loadingPlans || loadingMembers}
                    showWeather={true}
                />

                {/* Quick Actions Grid */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-1 h-5 bg-emerald-600 rounded-full"></div>
                        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Thao tác nhanh</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {[
                            { title: 'Bản đồ nông trại', icon: Map, color: 'text-blue-600', bgColor: 'bg-blue-50', path: 'map', desc: 'Xem không gian canh tác trực quan' },
                            { title: 'Lô đất & Cây trồng', icon: Grid3X3, color: 'text-emerald-600', bgColor: 'bg-emerald-50', path: 'land-plots', desc: 'Quản lý các khu vực sản xuất' },
                            { title: 'Kế hoạch mùa vụ', icon: Zap, color: 'text-amber-600', bgColor: 'bg-amber-50', path: 'season-plans', desc: 'Lập lịch trình và theo dõi tiến độ' },
                            { title: 'Kho hàng', icon: Warehouse, color: 'text-indigo-600', bgColor: 'bg-indigo-50', path: 'warehouses', desc: 'Quản lý vật tư và tồn kho' },
                        ].map((card, idx) => (
                            <button
                                key={idx}
                                onClick={() => navigate(`/farms/${farmId}/${card.path}`)}
                                className="flex flex-col items-start p-6 bg-white border border-slate-100 rounded-[28px] shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 group text-left relative overflow-hidden"
                            >
                                <div className={`w-12 h-12 ${card.bgColor} rounded-2xl flex items-center justify-center ${card.color} mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                                    <card.icon size={24} />
                                </div>
                                <h3 className="text-[15px] font-black text-slate-800 mb-1.5 group-hover:text-emerald-600 transition-colors">{card.title}</h3>
                                <p className="text-[11px] text-slate-400 font-medium leading-relaxed pr-6">{card.desc}</p>
                                
                                {/* Hover Indicator */}
                                <div className="absolute bottom-6 right-6 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                                        <ArrowRight size={14} className="text-emerald-600" />
                                    </div>
                                </div>

                                {/* Subtle Gradient background on hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-emerald-50/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Info & Team Section */}
                <FarmInfoSection
                    farmName={farmName}
                    description={farm?.description || 'Chưa có mô tả cho trang trại này.'}
                />
            </div>

            <EditFarmModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                farm={farm}
                onSuccess={() => fetchFarmsSummary()}
            />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Xóa trang trại"
                message={`Bạn có chắc chắn muốn xóa trang trại "${farmName}"? Hành động này không thể hoàn tác và toàn bộ dữ liệu liên quan sẽ bị mất.`}
                confirmLabel="Vâng, hãy xóa nó"
                cancelLabel="Quay lại"
                loading={isDeleting}
                type="danger"
            />
        </div>
    );
};

export default FarmActionsPage;
