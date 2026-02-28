'use client';
export default function ExportPDF() {
  const handleExport = () => {
    alert('PDF 匯出功能開發中...\n請使用瀏覽器列印功能 (Ctrl+P) 儲存為 PDF');
  };
  return (<div className='bg-white rounded-lg shadow p-4 mb-4'><h3 className='text-lg font-bold text-gray-800'>🗾 行程匯出</h3><button onClick={handleExport} className='w-full bg-blue-500 text-white py-2 rounded'>匯出 PDF</button></div>);
}
