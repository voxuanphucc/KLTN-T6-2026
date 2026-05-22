import { Droplets, Thermometer, Wind, Map, Trees, ClipboardList, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { useWeather } from '@/hooks/weather/useWeather';

interface QuickStatsProps {
  plotsCount: number;
  cropsCount: number;
  plansCount: number;
  membersCount: number;
  loading?: boolean;
  showWeather?: boolean;
}

export default function QuickStats({
  plotsCount,
  cropsCount,
  plansCount,
  membersCount,
  loading: farmLoading = false,
  showWeather = false
}: QuickStatsProps) {
  const { data: weather, loading: weatherLoading } = useWeather(showWeather);

  const weatherData = {
    temperature: (weatherLoading || !weather || !showWeather) ? '...' : weather.temp.toFixed(1),
    humidity: (weatherLoading || !weather || !showWeather) ? '...' : weather.humidity,
    windSpeed: (weatherLoading || !weather || !showWeather) ? '...' : weather.windSpeed.toFixed(2),
  };

  const statItems = [
    {
      label: 'Nhiệt độ',
      value: `${weatherData.temperature}°C`,
      trend: '-1.2%',
      trendUp: false,
      icon: Thermometer,
      color: 'emerald',
    },
    {
      label: 'Độ ẩm',
      value: `${weatherData.humidity}%`,
      trend: '+0.8%',
      trendUp: true,
      icon: Droplets,
      color: 'blue',
    },
    {
      label: 'Tốc độ gió',
      value: `${weatherData.windSpeed} km/h`,
      trend: '+2.5%',
      trendUp: true,
      icon: Wind,
      color: 'slate',
    },
    {
      label: 'Lô đất',
      value: farmLoading ? '...' : plotsCount,
      subLabel: 'Khu vực',
      icon: Map,
      color: 'amber',
    },
    {
      label: 'Cây trồng',
      value: farmLoading ? '...' : cropsCount,
      subLabel: 'Sản phẩm',
      icon: Trees,
      color: 'green',
    },
    {
      label: 'Kế hoạch',
      value: farmLoading ? '...' : plansCount,
      subLabel: 'Tổng số',
      icon: ClipboardList,
      color: 'indigo',
    },
    {
      label: 'Thành viên',
      value: farmLoading ? '...' : membersCount,
      subLabel: 'Nhân sự',
      icon: Users,
      color: 'rose',
    },
  ].filter(item => {
    if (!showWeather && ['Nhiệt độ', 'Độ ẩm', 'Tốc độ gió'].includes(item.label)) {
      return false;
    }
    return true;
  });

  const getColorClasses = (color: string) => {
    const classes: Record<string, string> = {
      emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      blue: 'bg-blue-50 text-blue-600 border-blue-100',
      slate: 'bg-slate-50 text-slate-600 border-slate-100',
      amber: 'bg-amber-50 text-amber-600 border-amber-100',
      green: 'bg-green-50 text-green-600 border-green-100',
      indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      rose: 'bg-rose-50 text-rose-600 border-rose-100',
    };
    return classes[color] || classes.slate;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {statItems.map((item, idx) => (
        <div key={idx} className="bg-white p-3.5 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex items-start justify-between mb-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 border ${getColorClasses(item.color)}`}>
              <item.icon size={16} />
            </div>
            {item.trend && (
              <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black ${item.trendUp ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                {item.trendUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                <span>{item.trend}</span>
              </div>
            )}
          </div>
          
          <div className="space-y-0.5">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider line-clamp-1">{item.label}</p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-base font-black text-slate-900 leading-none">{item.value}</h3>
              {item.subLabel && (
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter truncate">{item.subLabel}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
