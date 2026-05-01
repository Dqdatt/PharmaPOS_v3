export default function Employees() {
  const staff = [
    { name: 'Nguyễn Thị Mai', email: 'mai.nt@medpoint.vn', role: 'Admin', lastActive: '10 phút trước', revenue: '12.500.000đ', status: 'Đang hoạt động', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDT9BpdX1_B2f4_-K4RhmF1iQE03_nCz7BDXunxjhk9B4NPUFolBjY6qc1EJqLbixPupN7CdvDk5V1RB_cf-AX-PJzII6jrcNoiTCmTGStQvZI6WHpuxCHXc2eJHlUsYZ-i1dkKByBXB7k3UnNOum97_L0F3Czh6I2S1PLsWX7Ktxq3B29OBptKmA5qdWS3_5tNLvOcqeWHV4tibGRnmybmR488z4xRJdg3NIxvIKZgbwpbFKzMYoqv47HOr-4SmnHtGhk0qON3t7Y' },
    { name: 'Trần Văn Hoàng', email: 'hoang.tv@medpoint.vn', role: 'Thu ngân', lastActive: 'Hôm qua, 18:30', revenue: '8.240.000đ', status: 'Đang hoạt động', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAuLYYlXIjzg3p5btEQIaRgATFkT90oQt7Usi5zOzb43rkDwF0qqJsMt8J514O5tlqujtwUKbAYm4K_1SNqidOTXhFjFfvxmZvYeTjtt1gzKLqZocwRKW9qDJmTngjv-1QWy2mT7tiFyy0iKGpU-GTMrDU0uforO-PRB4NRxIERCtMrc4HghDptVPVkfwGz3Qp09p_0W8sF0qK4uStRBzwq6kljl_W4Q8iikZi34JMnvQ9vrkkyRcLCKjUUDeo785MREURJNTPBlm8' },
    { name: 'Lê Minh Tuấn', email: 'tuan.lm@medpoint.vn', role: 'Thu ngân', lastActive: '2 ngày trước', revenue: '0đ', status: 'Đã khóa', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8UCyFhbwEERB-534EkyaNmw_ygt-7O3uAB6bztjHZUMOKxTy9fdx9zXpXQTkXF7MaqPdBfZtSOPlK2sebPbpll9u4NG4WSsDBAzV9fJqZDPKosdRVQGtgatxJ9wxc5Rebzo3uhhioy7mFcY-L8Qd7teXq4LG4WSW9pQv7nd0NJ1bq-mq3pa0-_MuDBTwqB0uU7cKPe6PTvojAb1KzISlaqPkJ2YHIx4fwSnUIMuompshOVpEO3CGNOsCjgXeSG1uuEEmqnIOjXLI' },
    { name: 'Phạm Hương Giang', email: 'giang.ph@medpoint.vn', role: 'Thu ngân', lastActive: 'Đang trực', revenue: '5.670.000đ', status: 'Đang hoạt động', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDa6uVINWYMr2WFCmMpNjt5twtjeXawzGN7zaSAOUt2D5n5NCSA_Stk5Eo-KKzGRNxWvUqdO6nAxrr0bzTFEdIJPJMlQ_qqYjApBcTWTi_2Mx_kOdzBQeEO0E089IJw1D6VFEpqE1PmfLIn9_BLshdrc8iXxo0_AmeXSYmHc5Oa_sbK1j5X3-1jTJIP395F4ZYA9YxDD7XaLJWqdgdORRcS60ekoYM0FkqF8aak1Sn5SgXf1z5HaTM1ePdyaeqPhgjEpu3Azc0n5dk' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Quản lý Nhân Viên</h2>
          <p className="text-sm text-outline font-medium">Quản lý danh sách, quyền truy cập và hiệu suất nhân viên.</p>
        </div>
        <button className="bg-primary hover:brightness-110 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg active:scale-[0.98]">
          <span className="material-symbols-outlined text-xl">person_add</span> Thêm Nhân Viên
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {[
          { label: 'Tổng nhân sự', value: '24', delta: '+2 trong tháng này', icon: 'groups', color: 'text-primary', bg: 'bg-primary-fixed' },
          { label: 'Đang hoạt động', value: '18', delta: 'Trên tổng 24 tài khoản', icon: 'fiber_manual_record', color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Doanh thu trung bình', value: '4.2M', delta: '-5% so với tuần trước', icon: 'payments', color: 'text-tertiary', bg: 'bg-tertiary-fixed' },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-outline-variant p-6 rounded-2xl shadow-sm flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-outline uppercase tracking-[0.15em] mb-1">{stat.label}</p>
              <h3 className={`text-4xl font-bold ${stat.color}`}>{stat.value}</h3>
              <p className={`text-[10px] font-bold mt-2 flex items-center gap-1 ${stat.delta.includes('-') ? 'text-error' : 'text-secondary'}`}>
                {stat.delta}
              </p>
            </div>
            <div className={`p-4 ${stat.bg} rounded-xl ${stat.color}`}>
              <span className="material-symbols-outlined text-2xl fill-icon">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center px-6">
          <div className="flex gap-4">
            <button className="bg-white border border-outline-variant px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-colors">
              <span className="material-symbols-outlined text-lg">filter_alt</span> Lọc
            </button>
            <div className="flex items-center gap-2 text-sm text-outline font-bold">
              Hiển thị: 
              <select className="bg-transparent border-none focus:ring-0 font-bold text-on-surface cursor-pointer">
                <option>Tất cả</option>
                <option>Quản trị</option>
                <option>Thu ngân</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-surface-container rounded-full text-outline transition-colors"><span className="material-symbols-outlined">print</span></button>
            <button className="p-2 hover:bg-surface-container rounded-full text-outline transition-colors"><span className="material-symbols-outlined">download</span></button>
          </div>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-lowest text-outline text-[10px] font-bold border-b border-outline-variant uppercase tracking-widest">
              <th className="px-6 py-4">Nhân viên</th>
              <th className="px-6 py-4">Tài khoản</th>
              <th className="px-6 py-4">Vai trò</th>
              <th className="px-6 py-4">Truy cập cuối</th>
              <th className="px-6 py-4">Doanh thu</th>
              <th className="px-6 py-4 text-center">Trạng thái</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {staff.map((s, i) => (
              <tr key={i} className={`hover:bg-surface-container-low transition-colors ${s.status === 'Đã khóa' ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img className="w-10 h-10 rounded-full object-cover border border-outline-variant" src={s.avatar} alt={s.name} />
                    <div>
                      <p className="font-bold text-sm">{s.name}</p>
                      <p className="text-[10px] text-outline font-medium">{s.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium">{s.email.split('@')[0]}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${s.role === 'Admin' ? 'bg-primary-fixed text-primary' : 'bg-secondary-container text-secondary'}`}>
                    {s.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-outline font-medium">{s.lastActive}</td>
                <td className="px-6 py-4 text-sm font-bold text-primary">{s.revenue}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${s.status === 'Đang hoạt động' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 text-outline">
                    <button className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"><span className="material-symbols-outlined text-lg">edit</span></button>
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><span className="material-symbols-outlined text-lg">lock_reset</span></button>
                    <button className={`p-2 rounded-lg transition-colors ${s.status === 'Đã khóa' ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'hover:bg-red-50 hover:text-error'}`}>
                      <span className="material-symbols-outlined text-lg">{s.status === 'Đã khóa' ? 'lock_open' : 'lock'}</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
