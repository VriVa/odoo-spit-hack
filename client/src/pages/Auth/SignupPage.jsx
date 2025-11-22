import { SignUp } from "@clerk/clerk-react";
import { Package, Box, Layers, TrendingUp } from "lucide-react";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#6D4C41' }}>
      <div className="w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row" style={{ margin: '0' }}>
        
        {/* Left Side - Sign Up Form */}
        <div className="w-full lg:w-[45%] p-8 lg:p-10 flex flex-col justify-center" style={{ backgroundColor: '#EFEBE9' }}>
          <div className="max-w-sm mx-auto w-full">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10">
              <Package size={32} style={{ color: '#4E342E' }} strokeWidth={2.5} />
              <span className="text-2xl font-bold tracking-tight" style={{ color: '#4E342E' }}>
                StockMaster
              </span>
            </div>

            

            {/* Clerk Sign Up Component */}
            <SignUp path="/sign-up" routing="path" />
          </div>
        </div>

        {/* Right Side - Illustration */}
        <div className="w-full lg:w-[55%] p-10 lg:p-12 flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: '#8D6E63' }}>
          
          {/* Decorative elements */}
          <div className="absolute top-16 right-20 w-40 h-40 rounded-full" style={{ backgroundColor: 'rgba(109, 76, 65, 0.3)' }}></div>
          <div className="absolute bottom-20 left-16 w-28 h-28 rounded-full" style={{ backgroundColor: 'rgba(109, 76, 65, 0.2)' }}></div>

          <div className="relative z-10 text-center max-w-md">
            {/* Illustration Area */}
            <div className="mb-10 relative">
              {/* Floating icon */}
              <div className="absolute -top-6 -left-6 w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                <Package className="text-white" size={28} />
              </div>

              {/* Phone/Device mockup */}
              <div className="relative mx-auto w-56 h-72 bg-white rounded-3xl shadow-2xl p-4 transform rotate-3">
                <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-12 h-1 rounded-full" style={{ backgroundColor: '#E0E0E0' }}></div>
                
                {/* Content inside phone */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 p-2.5 rounded-xl" style={{ backgroundColor: '#F5F5F5' }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#6D4C41' }}>
                      <Box className="text-white" size={20} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="h-1.5 rounded w-16 mb-1.5" style={{ backgroundColor: '#E0E0E0' }}></div>
                      <div className="h-1.5 rounded w-12" style={{ backgroundColor: '#E0E0E0' }}></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-xl" style={{ backgroundColor: '#F5F5F5' }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#8D6E63' }}>
                      <Layers className="text-white" size={20} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="h-1.5 rounded w-20 mb-1.5" style={{ backgroundColor: '#E0E0E0' }}></div>
                      <div className="h-1.5 rounded w-16" style={{ backgroundColor: '#E0E0E0' }}></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-xl" style={{ backgroundColor: '#F5F5F5' }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#A1887F' }}>
                      <TrendingUp className="text-white" size={20} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="h-1.5 rounded w-16 mb-1.5" style={{ backgroundColor: '#E0E0E0' }}></div>
                      <div className="h-1.5 rounded w-14" style={{ backgroundColor: '#E0E0E0' }}></div>
                    </div>
                  </div>
                </div>

                {/* Person illustration */}
                <div className="absolute -right-6 bottom-10 w-20 h-28 rounded-full" style={{ background: 'linear-gradient(180deg, #5C9FE8 0%, #4A8DD4 100%)' }}></div>
                <div className="absolute -right-4 bottom-8 w-6 h-14 rounded-full" style={{ background: 'linear-gradient(180deg, #F48FB1 0%, #EC407A 100%)' }}></div>
              </div>
            </div>

            {/* Text content */}
            <div className="text-white">
              <h2 className="text-2xl font-bold mb-3">
                Manage Your Inventory Seamlessly
              </h2>
              <p className="text-gray-100 opacity-90">
                Track, organize, and optimize your stock with powerful analytics and real-time insights
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}