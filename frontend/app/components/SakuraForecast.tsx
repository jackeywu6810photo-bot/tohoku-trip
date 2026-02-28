'use client';
export default function SakuraForecast() {
  const spots = ['仙台', '山形', '會津若松', '弘前'];
  return (<div className='bg-white rounded-lg shadow p-4 mb-4'><h3 className='text-lg font-bold text-gray-800'>🌸 2026 東北櫻花預報</h3><div className='space-y-2'>{spots.map((spot, i) => (<div key={i} className='p-2 bg-pink-100 rounded'>{spot} - 4月{5+i*3}日預測開花</div>))}</div></div>);
}
