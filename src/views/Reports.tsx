import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';

const data = [
  { name: 'T2', value: 8.2 },
  { name: 'T3', value: 12.5 },
  { name: 'T4', value: 9.8 },
  { name: 'T5', value: 15.2 },
  { name: 'T6', value: 11.4 },
  { name: 'T7', value: 18.5 },
  { name: 'CN', value: 12.4 },
];

const pieData = [
  { name: 'Tiền mặt', value: 65, color: '#006b5f' },
  { name: 'Chuyển khoản', value: 35, color: '#6df5e1' },
];

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Báo Cáo & Hóa Đơn</h2>
          <p className="text-sm text-outline">Theo dõi hiệu quả kinh doanh của nhà thuốc</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-outline-variant rounded-lg text-sm font-bold shadow-sm">
            <span className="material-symbols-outlined text-lg">calendar_today</span>
            Hôm nay: 24 Th05, 2024
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold shadow-md">
            <span className="material-symbols-outlined text-lg">download</span>
            Xuất báo cáo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {[
          { label: 'Doanh thu hôm nay', value: '12.450.000đ', delta: '+8.2% so với hôm qua', icon: 'payments', bg: 'bg-primary-fixed', text: 'text-primary' },
          { label: 'Doanh thu tháng', value: '342.800.000đ', delta: '+12.4% so với tháng trước', icon: 'calendar_month', bg: 'bg-secondary-container', text: 'text-secondary' },
          { label: 'Tổng hóa đơn', value: '1,284', delta: 'Trung bình 42 đơn/ngày', icon: 'description', bg: 'bg-tertiary-container', text: 'text-white' },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-outline-variant p-6 rounded-2xl shadow-sm flex items-center gap-6">
            <div className={`w-14 h-14 ${stat.bg} rounded-full flex items-center justify-center ${stat.text}`}>
              <span className="material-symbols-outlined text-3xl fill-icon">{stat.icon}</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-outline uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-xl font-bold text-on-surface">{stat.value}</h3>
              <p className={`text-[10px] font-bold mt-1 ${stat.text.includes('primary') ? 'text-secondary' : 'text-outline'}`}>{stat.delta}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 bg-white border border-outline-variant p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold">Xu hướng doanh thu</h3>
            <div className="flex bg-surface-container rounded-lg p-1">
              <button className="px-3 py-1 text-xs font-bold bg-white rounded-md shadow-sm">Ngày</button>
              <button className="px-3 py-1 text-xs font-bold text-outline">Tháng</button>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#6e7977' }} />
                <Tooltip cursor={{ fill: '#f1f4f3' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 6 ? '#0f766e' : '#9cf2e8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-4 bg-white border border-outline-variant p-6 rounded-2xl shadow-sm flex flex-col items-center">
          <h3 className="font-bold w-full mb-6">Phương thức thanh toán</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full space-y-3 mt-4">
            {pieData.map(d => (
              <div key={d.name} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                  <span>{d.name}</span>
                </div>
                <span className="font-bold">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
