import { User, Lock, ArrowRight, Languages, ShieldCheck } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  return (
    <div className="bg-surface text-on-background min-h-screen flex w-full">
      <main className="flex w-full min-h-screen">
        {/* Left Side: Medical Visual */}
        <section className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary-container">
          <div className="absolute inset-0 z-10 bg-gradient-to-tr from-primary-container/80 to-transparent"></div>
          <img 
            alt="Medical Laboratory" 
            className="absolute inset-0 object-cover w-full h-full"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZiWIofhbJ6nmmhPeFrnQJ9LTGaKctZrA1onSq1YXJHOn9Q9UQZBRY54AeT6Maq84UPmBiaLpfU9GFLWZ__dSIVjLIxscOAl7X9PR9_Cv9TXK98PwSH9EkKNUgipeVqhFqyJXfRBW_97lCJiNkgzWG1GERFEBG6uEgU_oPEQ1ahEClj4EUidYRqCCh4Tfapa2Eb9h5mdn2y8twCo8_jVejyNhib3MlyOpgP3XCb2CdisoRIJN4ZBQZNL4JbEDKTH1dR3KE5E1Uw2Q"
          />
          <div className="relative z-20 flex flex-col justify-end p-xl h-full text-white">
            <div className="max-w-md">
              <h2 className="text-4xl font-bold mb-6">Giải pháp quản lý nhà thuốc toàn diện</h2>
              <p className="text-lg opacity-90 leading-relaxed">
                Hệ thống MedPoint POS cung cấp độ chính xác tối đa và hiệu suất vượt trội cho các cơ sở y tế hiện đại.
              </p>
            </div>
            <div className="mt-xl flex gap-12">
              <div className="flex flex-col">
                <span className="text-3xl font-bold">10k+</span>
                <span className="text-xs uppercase tracking-wider opacity-75">Người dùng tin dùng</span>
              </div>
              <div className="w-px bg-white/20 h-12 self-center"></div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold">99.9%</span>
                <span className="text-xs uppercase tracking-wider opacity-75">Độ ổn định</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Login Card */}
        <section className="w-full lg:w-1/2 flex items-center justify-center p-lg bg-white">
          <div className="w-full max-w-[440px] bg-white border border-outline-variant rounded-2xl p-xl shadow-sm">
            <div className="flex flex-col items-center mb-xl">
              <div className="w-16 h-16 bg-primary-container rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <span className="material-symbols-outlined text-white text-4xl fill-icon">medical_services</span>
              </div>
              <h1 className="text-3xl font-bold text-primary-container tracking-tight">MedPoint POS</h1>
              <p className="text-on-surface-variant font-medium mt-1">Pharmacy Solutions</p>
            </div>

            <form className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider" htmlFor="username">Tên đăng nhập</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">person</span>
                  <input 
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-outline-variant bg-surface-container-low focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium" 
                    id="username" 
                    placeholder="Nhập tên đăng nhập" 
                    type="text"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider" htmlFor="password">Mật khẩu</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">lock</span>
                  <input 
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-outline-variant bg-surface-container-low focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium" 
                    id="password" 
                    placeholder="Nhập mật khẩu" 
                    type="password"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input className="peer h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary/20 cursor-pointer" type="checkbox"/>
                  <span className="text-sm font-medium text-on-surface-variant group-hover:text-on-surface transition-colors">Ghi nhớ đăng nhập</span>
                </label>
                <a className="text-xs font-bold text-primary hover:underline underline-offset-4" href="#">Quên mật khẩu?</a>
              </div>

              <button 
                className="w-full h-14 bg-primary-container text-white font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md"
                onClick={(e) => { e.preventDefault(); navigate('/pos'); }}
              >
                <span>Đăng Nhập</span>
                <span className="material-symbols-outlined text-xl">login</span>
              </button>
            </form>

            <div className="mt-12 pt-8 border-t border-outline-variant text-center">
              <p className="text-sm text-on-surface-variant">
                Bạn chưa có tài khoản? 
                <a className="text-primary font-bold hover:underline underline-offset-4 ml-1" href="#">Yêu cầu cấp quyền</a>
              </p>
              <div className="mt-8 flex justify-center items-center gap-6 text-outline">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">language</span>
                  <span className="text-xs font-bold">Tiếng Việt</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-outline-variant"></div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  <span className="text-xs font-bold">v2.4.0</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary-container z-50"></div>
    </div>
  );
}
