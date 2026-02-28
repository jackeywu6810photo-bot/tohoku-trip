'use client';
export default function FoodRecommend() {
  const foods = ['牛舌料理', '芋煮', '喜多方拉麵', '米澤牛'];
  return (<div className='bg-white rounded-lg shadow p-4 mb-4'><h3 className='text-lg font-bold text-gray-800'>🍱 東北美食推薦</h3><div className='space-y-2'>{foods.map((food, i) => (<div key={i} className='p-2 border rounded'>{food}</div>))}</div></div>);
}
