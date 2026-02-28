'use client';
import { useState, useEffect } from 'react';

interface ExchangeRateProps {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
}

export default function ExchangeRate({ fromCurrency, toCurrency, amount }: ExchangeRateProps) {
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    fetchExchangeRate();
    const interval = setInterval(fetchExchangeRate, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fromCurrency, toCurrency]);

  const fetchExchangeRate = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/' + fromCurrency);
      const data = await response.json();
      setRate(data.rates[toCurrency]);
      setLastUpdate(new Date().toLocaleString('zh-TW'));
    } catch (error) {
      const fallbackRates: Record<string, number> = {'TWD-JPY': 4.65, 'JPY-TWD': 0.215};
      setRate(fallbackRates[fromCurrency + '-' + toCurrency] || 1);
    } finally {
      setLoading(false);
    }
  };

  const convertedAmount = rate ? (amount * rate).toFixed(2) : '---';

  return (<div className='bg-white rounded-lg shadow p-4 mb-4'><h3 className='text-lg font-bold text-gray-800'>💰 即時匯率</h3><div className='text-2xl font-bold text-blue-600'>1 {fromCurrency} = {rate ? rate.toFixed(4) : '---'} {toCurrency}</div><div className='mt-3 p-3 bg-gray-50 rounded'><div className='text-sm text-gray-600'>旅費換算：</div><div className='text-xl font-bold text-purple-600'>{amount.toLocaleString()} {fromCurrency} ≈ {convertedAmount} {toCurrency}</div></div></div>);
}
