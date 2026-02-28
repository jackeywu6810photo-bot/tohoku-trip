'use client';
import ExchangeRate from './ExchangeRate';
import JRPassCalculator from './JRPassCalculator';
import SakuraForecast from './SakuraForecast';
import FoodRecommend from './FoodRecommend';
import ExportPDF from './ExportPDF';

export default function FeaturePanel() {
  return (<div className='space-y-4'>
    <div className='text-center py-4'><h2 className='text-xl font-bold'>🎯 旅遊工具箱</h2></div>
    <ExchangeRate fromCurrency='TWD' toCurrency='JPY' amount={50000} />
    <JRPassCalculator />
    <SakuraForecast />
    <FoodRecommend />
    <ExportPDF />
  </div>);
}
