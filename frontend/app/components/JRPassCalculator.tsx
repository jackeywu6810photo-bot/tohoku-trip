'use client';
import { useState } from 'react';

export default function JRPassCalculator() {
  const [segments, setSegments] = useState([{from: '仙台', to: '山形', cost: 1160}]);
  const JR_PASS_5DAY = 30000;
  const totalCost = segments.reduce((sum, seg) => sum + seg.cost, 0);
  const isPassWorth = totalCost > JR_PASS_5DAY;

  return (<div className='bg-white rounded-lg shadow p-4 mb-4'><h3 className='text-lg font-bold text-gray-800'>🚄 JR Pass 計算機</h3><div className='bg-gray-50 rounded p-3'><div className='flex justify-between mb-2'><span>單程總計：</span><span className='font-bold'>¥{totalCost.toLocaleString()}</span></div><div className='flex justify-between mb-2'><span>JR Pass (5日)：</span><span className='font-bold'>¥{JR_PASS_5DAY.toLocaleString()}</span></div><div className={'text-center py-2 rounded font-bold ' + (isPassWorth ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>{isPassWorth ? '✅ 建議購買 JR Pass！' : '❌ 單程較划算'}</div></div></div>);
}
