export default function TestColors() {
  return (
    <div className="min-h-screen bg-[#F6F1EC] p-8" dir="rtl">
      <h1 className="text-4xl font-bold text-[#1F3F3A] mb-8">בדיקת צבעים</h1>
      
      <div className="space-y-4">
        <div className="bg-[#F6F1EC] p-6 rounded-lg border-2 border-[#8B5A3C]">
          <p className="text-[#3A3A3A]">רקע קרם #F6F1EC</p>
        </div>
        
        <div className="bg-[#1F3F3A] p-6 rounded-lg">
          <p className="text-[#E6D3A3]">רקע ירוק כהה #1F3F3A עם טקסט זהב #E6D3A3</p>
        </div>
        
        <div className="bg-[#C9A24D] p-6 rounded-lg">
          <p className="text-[#1F3F3A]">רקע זהב #C9A24D עם טקסט ירוק</p>
        </div>
        
        <div className="w-64 h-64 rounded-full border-[6px] border-[#8B5A3C] bg-white overflow-hidden">
          <div className="w-full h-full flex items-center justify-center text-[#8B5A3C] font-bold">
            סמן מפה עגול עם מסגרת חומה
          </div>
        </div>
        
        <div className="text-4xl font-bold text-[#C9A24D]">
          ₪2,500,000
        </div>
      </div>
    </div>
  );
}
