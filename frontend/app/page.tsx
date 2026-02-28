'use client';
import { useState, useEffect } from 'react';
// 🔥 移除地圖元件引用 (這是單機版，不需要地圖)
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { addDays, format, parseISO, differenceInDays } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import FeaturePanel from './components/FeaturePanel';

// --- 資料模型 ---
interface Stop { 
    time: string; name: string; description?: string; transport?: string; 
    cost: number; currency?: string; 
    lat?: number; lng?: number; 
    tags?: string[]; // 🏷️ 標籤: 📷攝影, 🚁可空拍, 🚫禁空拍, 🌸必訪, ⛩️神社, 🍖美食 等
}
interface Weather { icon: string; temp: string; desc: string; }
interface Day { 
    dayNumber: number; theme: string; date: string; weather?: Weather; alternatives?: string; checklist?: string[]; stops: Stop[]; 
    accommodation?: string; accommodation_cost?: number; accommodation_currency?: string;
}
interface TripMeta { 
    title: string; days_count: number; travelers: number; budget: number; 
    location?: string; start_date?: string;
    home_currency?: string; destination_currency?: string; exchange_rate?: number;
}
interface Itinerary { trip_meta: TripMeta; days: Day[]; }

// --- 版型設定 ---
interface ThemeSettings { id: string; name: string; bgImage: string; bgColor: string; primaryColor: string; cardBg: string; fontFamily: string; fontSize: number; textColor: string; }

const PRESET_THEMES: ThemeSettings[] = [
    { 
        id: 'default', 
        name: "❄️ 東北雪季", 
        bgImage: 'https://images.unsplash.com/photo-1528164344705-47542687000d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', 
        bgColor: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', 
        primaryColor: '#e63946', 
        cardBg: 'rgba(255, 255, 255, 0.9)', 
        fontFamily: "'Noto Sans TC', sans-serif", 
        fontSize: 16, 
        textColor: '#334155' 
    },
    { 
        id: 'sakura', 
        name: "🌸 春日櫻花", 
        bgImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', 
        bgColor: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', 
        primaryColor: '#db2777', 
        cardBg: 'rgba(255, 250, 250, 0.9)', 
        fontFamily: "'Yu Mincho', serif", 
        fontSize: 16, 
        textColor: '#5d4037' 
    },
    { 
        id: 'kyoto', 
        name: "⛩️ 京都古風", 
        bgImage: 'https://images.unsplash.com/photo-1493780474015-ba834fd0ce05?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', 
        bgColor: '#e6e0d4', 
        primaryColor: '#8c7b75', 
        cardBg: 'rgba(255, 252, 245, 0.95)', 
        fontFamily: "'HiraMinProN-W3', 'Songti TC', serif", 
        fontSize: 17, 
        textColor: '#2c2c2c' 
    },
    { 
        id: 'modern', 
        name: "🏙️ 東京現代", 
        bgImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', 
        bgColor: '#1a1a1a', 
        primaryColor: '#3b82f6', 
        cardBg: 'rgba(30, 41, 59, 0.9)', 
        fontFamily: "'Roboto', sans-serif", 
        fontSize: 15, 
        textColor: '#e2e8f0' 
    }
];

const CURRENCIES = [
    { code: 'TWD', name: '新台幣', flag: '🇹🇼' }, { code: 'JPY', name: '日圓', flag: '🇯🇵' },
    { code: 'USD', name: '美金', flag: '🇺🇸' }, { code: 'HKD', name: '港幣', flag: '🇭🇰' },
    { code: 'CNY', name: '人民幣', flag: '🇨🇳' }, { code: 'KRW', name: '韓元', flag: '🇰🇷' },
    { code: 'EUR', name: '歐元', flag: '🇪🇺' },
];

export default function Home() {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showTransport, setShowTransport] = useState(true);
  const [activeDay, setActiveDay] = useState(1);
  const [showFeatures, setShowFeatures] = useState(false);

  const handleCurrencySettingChange = (type: 'home' | 'dest', value: string) => {
    if (!itinerary) return;
    const newMeta = { ...itinerary.trip_meta };
    if (type === 'home') {
      newMeta.home_currency = value;
    } else {
      newMeta.destination_currency = value;
    }
    setItinerary({ ...itinerary, trip_meta: newMeta });
  };
  const [activeBudgetCategory, setActiveBudgetCategory] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeSettings>(PRESET_THEMES[0]);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(new Date());
  const [tempEndDate, setTempEndDate] = useState<Date | null>(new Date());

  // 🔥🔥🔥 關鍵修正：自動抓取當前網址 (包含 Port) 🔥🔥🔥
  // 這樣不管後端開在 8000 還是 49152，前端都能自動對上
  const API_BASE = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000';

  useEffect(() => { fetchData(); }, []);

  const fetchData = () => {
    fetch(`${API_BASE}/api/itinerary`)
      .then((res) => {
          if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
          return res.json();
      })
      .then((data) => {
        if (!data || !data.days) {
            console.error("後端回傳資料異常:", data);
            setItinerary(null); 
            setLoading(false);
            return;
        }
        const sortedData = sortAllStops(data);
        setItinerary(sortedData);
        setLoading(false);
      })
      .catch((err) => {
          console.error("API Error:", err);
          setLoading(false); 
      });
  };

  const sortAllStops = (data: Itinerary) => {
    if (!data || !data.days) return data;
    const newData = { ...data };
    newData.days.forEach(day => {
      if(day.stops) day.stops.sort((a, b) => a.time.localeCompare(b.time));
    });
    return newData;
  };

  const formatMoney = (cost: number, currencyCode?: string, showApprox: boolean = true) => {
    if (!itinerary || !itinerary.trip_meta) return `¥${(cost || 0).toLocaleString()}`;
    const homeCurr = itinerary.trip_meta.home_currency || 'TWD';
    const destCurr = itinerary.trip_meta.destination_currency || 'JPY';
    const rate = itinerary.trip_meta.exchange_rate || 0.215;
    
    const currentCurrency = currencyCode || destCurr;
    const safeCost = cost || 0;
    
    if (currentCurrency === homeCurr) {
        return <span className="font-mono">{homeCurr} {safeCost.toLocaleString()}</span>;
    }

    const converted = Math.round(safeCost * rate);
    
    if (!showApprox) return <span className="font-mono">{currentCurrency} {safeCost.toLocaleString()}</span>;

    return (
        <span className="flex flex-col leading-tight">
            <span className="font-mono">{currentCurrency} {safeCost.toLocaleString()}</span>
            <span className="text-[0.7em] opacity-70 font-normal">≈ {homeCurr} {converted.toLocaleString()}</span>
        </span>
    );
  };

  const getConvertedValue = (cost: number, currencyCode?: string) => {
      if (!itinerary || !itinerary.trip_meta) return 0;
      const homeCurr = itinerary.trip_meta.home_currency || 'TWD';
      const destCurr = itinerary.trip_meta.destination_currency || 'JPY';
      const rate = itinerary.trip_meta.exchange_rate || 0.215;
      
      const currentCurrency = currencyCode || destCurr;
      if (currentCurrency === homeCurr) return cost;
      return Math.round(cost * rate);
  };

// 🏷️ 標籤顯示元件
const TagBadge = ({ tag }: { tag: string }) => {
  const tagStyles: Record<string, string> = {
    '📷 攝影點': 'bg-purple-100 text-purple-700 border-purple-200',
    '🚁 可空拍': 'bg-sky-100 text-sky-700 border-sky-200',
    '🚫 禁空拍': 'bg-red-100 text-red-700 border-red-200',
    '🌸 必訪': 'bg-pink-100 text-pink-700 border-pink-200',
    '🌸 櫻花': 'bg-pink-100 text-pink-700 border-pink-200',
    '⛩️ 必訪': 'bg-orange-100 text-orange-700 border-orange-200',
    '⛩️ 神社': 'bg-orange-100 text-orange-700 border-orange-200',
    '⛩️ 歷史': 'bg-amber-100 text-amber-700 border-amber-200',
    '🍖 美食': 'bg-green-100 text-green-700 border-green-200',
    '🍱 必吃美食': 'bg-green-100 text-green-700 border-green-200',
    '🍱 午餐': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    '🍱 晚餐': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    '🍜 美食': 'bg-green-100 text-green-700 border-green-200',
    '🍡 早餐': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    '🏯 必訪': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    '🐋 必訪': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    '🛍️ 購物': 'bg-violet-100 text-violet-700 border-violet-200',
    '💧 倒影': 'bg-blue-100 text-blue-700 border-blue-200',
    '🌅 黃金時段 8-10點': 'bg-amber-100 text-amber-700 border-amber-200',
    '🌲 杉木': 'bg-green-100 text-green-800 border-green-200',
    '⚠️ 需預約': 'bg-red-100 text-red-700 border-red-200',
  };
  
  const style = tagStyles[tag] || 'bg-gray-100 text-gray-700 border-gray-200';
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {tag}
    </span>
  );
};
  const handlePresetChange = (themeId: string) => { const selected = PRESET_THEMES.find(t => t.id === themeId); if (selected) setCurrentTheme(selected); };
  const handleCustomThemeChange = (field: keyof ThemeSettings, value: string | number) => { setCurrentTheme(prev => ({ ...prev, id: 'custom', name: '自訂版型', [field]: value })); };
  const handleDateRangeChange = (dates: [Date | null, Date | null]) => { const [start, end] = dates; setTempStartDate(start); setTempEndDate(end); };
  
  const saveTripSettings = () => {
    if (!itinerary || !tempStartDate || !tempEndDate) return;
    const newItinerary = { ...itinerary };
    const newDaysCount = differenceInDays(tempEndDate, tempStartDate) + 1;
    newItinerary.trip_meta.start_date = format(tempStartDate, 'yyyy-MM-dd');
    newItinerary.trip_meta.days_count = newDaysCount;
    
    if (newItinerary.days) {
        if (newDaysCount < newItinerary.days.length) {
            newItinerary.days = newItinerary.days.slice(0, newDaysCount);
        }
        const currentDays = newItinerary.days.length;
        newItinerary.days = newItinerary.days.map((day, index) => {
            const newDate = addDays(tempStartDate, index);
            const weekDay = format(newDate, 'eeee', { locale: zhTW });
            return { ...day, date: `${format(newDate, 'yyyy-MM-dd')} (${weekDay})` };
        });
        if (newDaysCount > currentDays) {
            for (let i = currentDays; i < newDaysCount; i++) {
                const newDate = addDays(tempStartDate, i);
                const weekDay = format(newDate, 'eeee', { locale: zhTW });
                newItinerary.days.push({
                    dayNumber: i + 1, theme: "自由探索",
                    date: `${format(newDate, 'yyyy-MM-dd')} (${weekDay})`,
                    stops: [], accommodation: "", accommodation_cost: 0,
                    accommodation_currency: newItinerary.trip_meta.destination_currency || 'JPY'
                });
            }
        } 
    }
    setItinerary(newItinerary);
    setIsSettingsOpen(false);
    handleSave(newItinerary);
  };

  const openSettingsModal = () => { if (itinerary) { const start = itinerary.trip_meta.start_date ? parseISO(itinerary.trip_meta.start_date) : new Date(); const end = addDays(start, (itinerary.trip_meta.days_count || 1) - 1); setTempStartDate(start); setTempEndDate(end); setIsSettingsOpen(true); }};
  
  const handleSave = async (dataToSave?: Itinerary) => {
    const data = dataToSave || itinerary;
    if (!data) return;
    const sortedItinerary = sortAllStops(data);
    if (dataToSave) setItinerary(sortedItinerary);

    try {
      const saveBtn = document.getElementById('save-btn');
      if(saveBtn) saveBtn.innerText = '運算中...';
      const res = await fetch(`${API_BASE}/api/itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sortedItinerary),
      });
      if (!res.ok) throw new Error("儲存失敗");
      alert('✅ 儲存成功！');
      setIsEditing(false);
      fetchData(); 
    } catch (e) {
      console.error(e);
      alert('連線錯誤：無法儲存，請檢查後端是否執行中。');
    }
  };

  // 🔥 使用 as any 解決 TypeScript 型別報錯
  const handleStopChange = (dayIndex: number, stopIndex: number, field: keyof Stop, value: string | number | string[]) => {
    if (!itinerary) return;
    const newItinerary = { ...itinerary };
    (newItinerary.days[dayIndex].stops[stopIndex] as any)[field] = value;
    setItinerary(newItinerary);
  };

  const handleMetaChange = (field: keyof TripMeta, value: string | number) => {
    if (!itinerary) return;
    const newItinerary = { ...itinerary };
    (newItinerary.trip_meta as any)[field] = value;
    setItinerary(newItinerary);
  };

  const handleTimeBlur = () => { if (!itinerary) return; setItinerary(sortAllStops(itinerary)); };
  
  const handleAccommodationChange = (dayIndex: number, field: 'name' | 'cost' | 'currency', value: string | number) => {
    if (!itinerary) return;
    const newItinerary = { ...itinerary };
    if (field === 'name') newItinerary.days[dayIndex].accommodation = value as string;
    else if (field === 'currency') newItinerary.days[dayIndex].accommodation_currency = value as string;
    else newItinerary.days[dayIndex].accommodation_cost = value as number;
    setItinerary(newItinerary);
  };

  const handleAddStop = (dayIndex: number) => { 
    if (!itinerary) return; 
    const newItinerary = { ...itinerary }; 
    const defaultCurr = itinerary.trip_meta.destination_currency || 'JPY'; 
    const newStop: Stop = { 
      time: "12:00", 
      name: "新景點", 
      description: "", 
      transport: "", 
      cost: 0, 
      currency: defaultCurr, 
      lat: 0, 
      lng: 0,
      tags: [] // 🏷️ 初始化空標籤陣列
    }; 
    newItinerary.days[dayIndex].stops.push(newStop); 
    newItinerary.days[dayIndex].stops.sort((a, b) => a.time.localeCompare(b.time)); 
    setItinerary(newItinerary); 
  };
  const handleDeleteStop = (dayIndex: number, stopIndex: number) => { if (!itinerary || !confirm('確定要刪除這個行程嗎？')) return; const newItinerary = { ...itinerary }; newItinerary.days[dayIndex].stops.splice(stopIndex, 1); setItinerary(newItinerary); };

  const getBudgetDetails = (category: string) => {
    if (!itinerary || !itinerary.trip_meta || !itinerary.days) return { items: [], total: 0, title: '', color: '' };
    
    let items: { date: string; name: string; cost: number; currency: string; note: string }[] = [];
    let totalHomeCurrency = 0;
    let title = '';
    let color = '';
    
    const homeCurr = itinerary.trip_meta.home_currency || 'TWD';
    const destCurr = itinerary.trip_meta.destination_currency || 'JPY';
    const rate = itinerary.trip_meta.exchange_rate || 0.215;

    const calc = (cost: number, curr?: string) => {
        const c = curr || destCurr;
        const val = cost || 0; 
        if (c === homeCurr) return val;
        return Math.round(val * rate);
    };

    if (category === 'all') {
        title = `消費總覽 (折合 ${homeCurr})`; color = 'bg-purple-600';
        itinerary.days.forEach(day => {
            const accCost = day.accommodation_cost || 0;
            const accCurr = day.accommodation_currency || destCurr;
            if ((day.accommodation && day.accommodation !== '無') || accCost > 0) { 
                items.push({ date: day.date, name: day.accommodation || '未定飯店', cost: accCost, currency: accCurr, note: "住宿" }); 
                totalHomeCurrency += calc(accCost, accCurr); 
            }
            if (day.stops) {
                day.stops.forEach(stop => { 
                    if (stop.cost > 0) { 
                        const curr = stop.currency || destCurr;
                        items.push({ date: day.date, name: stop.name, cost: stop.cost, currency: curr, note: stop.transport ? `交通` : '行程' }); 
                        totalHomeCurrency += calc(stop.cost, curr); 
                    }
                });
            }
        });
    } else if (category === 'accommodation') {
      title = '住宿費用明細'; color = 'bg-sky-600';
      itinerary.days.forEach(day => { 
          const cost = day.accommodation_cost || 0; 
          const curr = day.accommodation_currency || destCurr;
          if ((day.accommodation && day.accommodation !== '無') || cost > 0) { 
              items.push({ date: day.date, name: day.accommodation || '未定飯店', cost: cost, currency: curr, note: "預算" }); 
              totalHomeCurrency += calc(cost, curr); 
          }
      });
    } else {
      itinerary.days.forEach(day => {
        if (day.stops) {
            day.stops.forEach(stop => {
            let isMatch = false;
            const name = stop.name || ""; 
            if (category === 'transport') { title = '交通移動明細'; color = 'bg-rose-600'; if ((stop.transport && stop.transport !== "") || ["移動", "機場", "巴士", "JR", "新幹線", "電車", "車資", "計程車"].some(k => name.includes(k))) isMatch = true; } 
            else if (category === 'food') { title = '飲食與購物明細'; color = 'bg-emerald-600'; if (['牛舌', '晚餐', '午餐', '早餐', '購物', '奶昔', '茶寮', '食', '飯', '拉麵', '蕎麥', '咖啡', '甜點'].some(k => name.includes(k))) isMatch = true; } 
            else if (category === 'attraction') { title = '門票與體驗明細'; color = 'bg-orange-500'; if (['神社', '寺', '館', '城', '園', '參拜', '門票', '體驗', '山', '公園', '纜車', '船', '展望台'].some(k => name.includes(k))) isMatch = true; }
            
            if (isMatch && stop.cost > 0) { 
                const curr = stop.currency || destCurr;
                items.push({ date: day.date, name: name, cost: stop.cost, currency: curr, note: stop.transport ? `交通` : '' }); 
                totalHomeCurrency += calc(stop.cost, curr); 
            }
            });
        }
      });
    }
    return { items, total: totalHomeCurrency, title, color };
  };

  const accData = getBudgetDetails('accommodation');
  const transData = getBudgetDetails('transport');
  const foodData = getBudgetDetails('food');
  const attrData = getBudgetDetails('attraction');
  const budgetModalData = activeBudgetCategory ? getBudgetDetails(activeBudgetCategory) : null;
  
  const currentDayData = itinerary?.days?.find(d => d.dayNumber === activeDay);
  const dayIndex = itinerary?.days ? itinerary.days.findIndex(d => d.dayNumber === activeDay) : 0;

  if (loading) return <div className="p-10 text-center text-gray-500">載入中... (請確保後端已啟動)</div>;
  if (!itinerary) return (
    <div className="p-10 text-center text-red-500">
        <h2 className="text-xl font-bold mb-2">無法載入行程資料</h2>
        <p>請檢查後端黑色視窗是否正常執行，且無錯誤訊息。</p>
        <button onClick={fetchData} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">重試連線</button>
    </div>
  );

  const endDateStr = itinerary.trip_meta.start_date ? format(addDays(parseISO(itinerary.trip_meta.start_date), itinerary.trip_meta.days_count - 1), 'yyyy年M月d日') : '未定';
  const startDateStr = itinerary.trip_meta.start_date ? format(parseISO(itinerary.trip_meta.start_date), 'yyyy年M月d日') : '未定';
  const homeCurr = itinerary.trip_meta.home_currency || 'TWD';
  const destCurr = itinerary.trip_meta.destination_currency || 'JPY';

  return (
    <main className="min-h-screen pb-20 transition-all duration-500" style={{ background: currentTheme.bgColor, fontFamily: currentTheme.fontFamily, fontSize: `${currentTheme.fontSize}px`, color: currentTheme.textColor }}>
      <header className="sticky top-0 z-50 backdrop-blur-md shadow-sm border-b border-gray-100" style={{ backgroundColor: currentTheme.cardBg }}>
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 text-xl font-bold" style={{ color: currentTheme.primaryColor }}>
            <i className="fas fa-map-marked-alt"></i><span>{itinerary.trip_meta.title}</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsEditing(!isEditing)} className={`px-4 py-2 rounded-full text-sm font-bold transition ${isEditing ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
               {isEditing ? '退出編輯' : '編輯行程'}
            </button>
            {isEditing && <button id="save-btn" onClick={() => handleSave()} className="px-4 py-2 rounded-full text-white text-sm font-bold shadow-md transition" style={{backgroundColor: '#22c55e'}}>儲存變更</button>}
            <button onClick={() => setIsThemeModalOpen(true)} className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition shadow-sm"><i className="fas fa-cog text-xl"></i></button>
          </div>
        </div>
      </header>

      {/* Hero 區塊 */}
      <section className="relative h-[400px] md:h-[500px] flex items-center justify-center text-center text-white mb-10 transition-all duration-700">
        <div className="absolute inset-0 bg-cover bg-center transition-all duration-700" style={{ backgroundImage: `url('${currentTheme.bgImage}')` }}></div>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center">
          {isEditing ? (
            <input type="text" value={itinerary.trip_meta.title} onChange={(e) => handleMetaChange('title', e.target.value)} className="text-4xl md:text-5xl font-bold mb-6 drop-shadow-lg bg-transparent border-b-2 border-white/50 text-center text-white placeholder-white/50 focus:outline-none focus:border-white w-full max-w-3xl transition-all" placeholder="請輸入行程標題"/>
          ) : (<h1 className="text-4xl md:text-5xl font-bold mb-6 drop-shadow-lg">{itinerary.trip_meta.title}</h1>)}

          <div onClick={openSettingsModal} className="text-lg md:text-xl opacity-90 mb-10 font-light cursor-pointer hover:bg-white/10 px-4 py-2 rounded-lg transition-colors flex items-center gap-2" title="點擊修改日期與地點">
             <i className="far fa-calendar-alt"></i><span>{startDateStr} - {endDateStr}</span><span className="mx-2">|</span>
             <i className="fas fa-map-marker-alt"></i><span>{itinerary.trip_meta.location || "請設定地點"}</span>
             <i className="fas fa-pen text-sm ml-2 opacity-50"></i>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto w-full">
            <div className="backdrop-blur-sm p-4 md:p-6 rounded-2xl border border-white/20 hover:bg-white/20 transition cursor-default" style={{backgroundColor: 'rgba(255,255,255,0.1)'}}><i className="fas fa-calendar-alt text-3xl mb-3 text-sky-300"></i><h3 className="text-xl font-bold">{itinerary.trip_meta.days_count}天{(itinerary.trip_meta.days_count || 1) - 1}夜</h3><p className="text-sm opacity-80">輕鬆深度遊</p></div>
            <div onClick={() => setActiveBudgetCategory('transport')} className="backdrop-blur-sm p-4 md:p-6 rounded-2xl border border-white/20 hover:bg-white/20 transition cursor-pointer hover:scale-105" style={{backgroundColor: 'rgba(255,255,255,0.1)'}}><i className="fas fa-train text-3xl mb-3 text-sky-300"></i><h3 className="text-xl font-bold">大眾運輸</h3><p className="text-sm opacity-80">點擊查看開銷</p></div>
            <div onClick={() => setActiveBudgetCategory('all')} className="backdrop-blur-sm p-4 md:p-6 rounded-2xl border border-white/20 hover:bg-white/20 transition cursor-pointer hover:scale-105" style={{backgroundColor: 'rgba(255,255,255,0.1)'}}>
                <i className="fas fa-wallet text-3xl mb-3 text-sky-300"></i>
                <div className="text-xl font-bold flex flex-col items-center">
                    <span>{homeCurr} {(accData.total + transData.total + foodData.total + attrData.total).toLocaleString()}</span>
                </div>
                <p className="text-sm opacity-80 mt-1">總消費估算</p>
            </div>
          </div>
        </div>
      </section>

      {/* 設定與彈出視窗區域 */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn" onClick={() => setIsSettingsOpen(false)}>
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2"><i className="fas fa-cog text-blue-600"></i> 行程基本設定</h3>
                <div className="space-y-6">
                    <div><label className="block text-sm font-bold text-gray-600 mb-1">主要地點</label><input type="text" value={itinerary.trip_meta.location || ''} onChange={(e) => handleMetaChange('location', e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-blue-500" placeholder="例如: 日本東北"/></div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="block text-sm font-bold text-gray-700 mb-3"><i className="fas fa-money-bill-wave text-green-600 mr-1"></i> 貨幣與匯率設定</label>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div><label className="text-xs text-gray-500 block mb-1">母國貨幣 (A)</label><select value={itinerary.trip_meta.home_currency} onChange={(e) => handleCurrencySettingChange('home', e.target.value)} className="w-full border p-2 rounded">{CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}</select></div>
                            <div><label className="text-xs text-gray-500 block mb-1">旅遊貨幣 (B)</label><select value={itinerary.trip_meta.destination_currency} onChange={(e) => handleCurrencySettingChange('dest', e.target.value)} className="w-full border p-2 rounded">{CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}</select></div>
                        </div>
                        <div className="flex items-center gap-2 bg-white p-2 rounded border border-gray-300"><span className="text-sm font-mono whitespace-nowrap">1 {destCurr} = </span><input type="number" step="0.0001" value={itinerary.trip_meta.exchange_rate || 0.215} onChange={(e) => handleMetaChange('exchange_rate', parseFloat(e.target.value))} className="w-full text-sm focus:outline-none font-bold text-blue-600"/><span className="text-sm font-mono">{homeCurr}</span></div>
                    </div>
                    <div><label className="block text-sm font-bold text-gray-600 mb-1">日期範圍</label><div className="border border-gray-300 rounded-lg p-3 bg-gray-50 flex justify-center"><DatePicker selectsRange={true} startDate={tempStartDate} endDate={tempEndDate} onChange={handleDateRangeChange} dateFormat="yyyy/MM/dd" className="bg-transparent text-center font-mono text-lg w-full focus:outline-none" locale={zhTW} inline /></div></div>
                </div>
                <div className="mt-8 flex gap-3"><button onClick={() => setIsSettingsOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition">取消</button><button onClick={saveTripSettings} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg transition">確認修改</button></div>
            </div>
        </div>
      )}

      {/* 版型設定 */}
      {isThemeModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn" onClick={() => setIsThemeModalOpen(false)}>
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 border-b pb-4"><h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><i className="fas fa-paint-brush text-pink-500"></i> 版型設定</h3><button onClick={() => setIsThemeModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><i className="fas fa-times"></i></button></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">{PRESET_THEMES.map(theme => (<div key={theme.id} onClick={() => handlePresetChange(theme.id)} className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${currentTheme.id === theme.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent'}`}><div className="h-20 bg-cover bg-center" style={{backgroundImage: `url(${theme.bgImage})`}}></div><div className="p-2 text-center text-sm font-bold bg-gray-50">{theme.name}</div></div>))}</div>
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                    <label className="block text-sm font-bold text-gray-700 mb-2">進階客製化</label>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div><label className="text-xs text-gray-500 mb-1 block">背景圖片 URL</label><input type="text" value={currentTheme.bgImage} onChange={(e) => handleCustomThemeChange('bgImage', e.target.value)} className="w-full border p-2 rounded text-sm"/></div>
                        <div><label className="text-xs text-gray-500 mb-1 block">主色調</label><div className="flex items-center gap-2"><input type="color" value={currentTheme.primaryColor} onChange={(e) => handleCustomThemeChange('primaryColor', e.target.value)} className="h-9 w-16 cursor-pointer"/><span className="text-xs font-mono">{currentTheme.primaryColor}</span></div></div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div><label className="text-xs text-gray-500 mb-1 block">字體系列</label><select value={currentTheme.fontFamily} onChange={(e) => handleCustomThemeChange('fontFamily', e.target.value)} className="w-full border p-2 rounded text-sm"><option value="'Noto Sans TC', sans-serif">黑體 (現代)</option><option value="'Yu Mincho', serif">明體 (古典)</option><option value="'Roboto', sans-serif">無襯線 (簡約)</option><option value="'Courier New', monospace">等寬 (復古)</option></select></div>
                        <div><label className="text-xs text-gray-500 mb-1 block">字體大小: {currentTheme.fontSize}px</label><input type="range" min="12" max="24" value={currentTheme.fontSize} onChange={(e) => handleCustomThemeChange('fontSize', parseInt(e.target.value))} className="w-full"/></div>
                    </div>
                </div>
                <div className="mt-8 text-center"><button onClick={() => setIsThemeModalOpen(false)} className="px-8 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 shadow-lg transition">完成設定</button></div>
            </div>
        </div>
      )}

      {/* 預算卡片 */}
      <div className="container mx-auto px-4 -mt-16 md:-mt-20 relative z-20">
          <div className="rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100" style={{backgroundColor: currentTheme.cardBg}}>
            <h3 className="flex items-center gap-3 text-2xl font-bold mb-8 border-b pb-4" style={{borderColor: '#e2e8f0'}}><i className="fas fa-chart-pie" style={{color: currentTheme.primaryColor}}></i> 預算分配 (折合 {homeCurr})<span className="text-sm font-normal opacity-60 ml-auto hidden md:inline">點擊卡片查看詳情</span></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div onClick={() => setActiveBudgetCategory('accommodation')} className="cursor-pointer p-6 rounded-2xl border border-transparent hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group" style={{backgroundColor: 'rgba(255,255,255,0.5)'}}><div className="flex justify-between items-center font-bold text-sky-700 mb-3"><span className="text-lg">住宿</span> <span className="text-xl font-mono">{homeCurr} {accData.total.toLocaleString()}</span></div><div className="text-sm opacity-70 mb-4">6晚住宿費用</div><div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-sky-500 w-[35%] group-hover:bg-sky-400 transition-colors"></div></div></div>
              <div onClick={() => setActiveBudgetCategory('transport')} className="cursor-pointer p-6 rounded-2xl border border-transparent hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group" style={{backgroundColor: 'rgba(255,255,255,0.5)'}}><div className="flex justify-between items-center font-bold text-rose-700 mb-3"><span className="text-lg">交通</span> <span className="text-xl font-mono">{homeCurr} {transData.total.toLocaleString()}</span></div><div className="text-sm opacity-70 mb-4">含JR與當地移動</div><div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-rose-500 w-[25%] group-hover:bg-rose-400 transition-colors"></div></div></div>
              <div onClick={() => setActiveBudgetCategory('food')} className="cursor-pointer p-6 rounded-2xl border border-transparent hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group" style={{backgroundColor: 'rgba(255,255,255,0.5)'}}><div className="flex justify-between items-center font-bold text-emerald-700 mb-3"><span className="text-lg">飲食</span> <span className="text-xl font-mono">{homeCurr} {foodData.total.toLocaleString()}</span></div><div className="text-sm opacity-70 mb-4">三餐與點心</div><div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[30%] group-hover:bg-emerald-400 transition-colors"></div></div></div>
              <div onClick={() => setActiveBudgetCategory('attraction')} className="cursor-pointer p-6 rounded-2xl border border-transparent hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group" style={{backgroundColor: 'rgba(255,255,255,0.5)'}}><div className="flex justify-between items-center font-bold text-orange-700 mb-3"><span className="text-lg">門票/體驗</span> <span className="text-xl font-mono">{homeCurr} {attrData.total.toLocaleString()}</span></div><div className="text-sm opacity-70 mb-4">景點門票等</div><div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-orange-400 w-[10%] group-hover:bg-orange-300 transition-colors"></div></div></div>
            </div>
          </div>
      </div>

      {activeBudgetCategory && budgetModalData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setActiveBudgetCategory(null)}>
          <div className="w-full max-w-4xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-slideUp" style={{backgroundColor: currentTheme.cardBg}} onClick={(e) => e.stopPropagation()}>
            <div className={`p-6 ${budgetModalData.color} text-white flex justify-between items-center shadow-md`}>
              <div className="flex items-baseline gap-4"><h3 className="text-2xl font-bold tracking-wide">{budgetModalData.title}</h3><p className="text-white/90 text-lg font-mono bg-white/20 px-3 py-1 rounded-lg">總計: {homeCurr} {budgetModalData.total.toLocaleString()}</p></div>
              <button onClick={() => setActiveBudgetCategory(null)} className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition"><i className="fas fa-times"></i></button>
            </div>
            <div className="flex-1 overflow-y-auto p-0" style={{backgroundColor: 'rgba(255,255,255,0.5)'}}>
              {budgetModalData.items.length === 0 ? (<div className="flex flex-col items-center justify-center py-20 opacity-60"><i className="fas fa-file-invoice-dollar text-4xl mb-4"></i><p className="text-lg">尚無詳細資料</p></div>) : (
                <div className="p-8">
                    <table className="w-full text-left border-collapse rounded-xl overflow-hidden shadow-sm">
                        <thead style={{backgroundColor: 'rgba(0,0,0,0.05)'}}><tr><th className="py-4 px-6 text-base font-bold w-[140px]">日期</th><th className="py-4 px-6 text-base font-bold">項目名稱</th><th className="py-4 px-6 text-base font-bold text-right">原始金額</th><th className="py-4 px-6 text-base font-bold text-right">折合 ({homeCurr})</th></tr></thead>
                        <tbody className="divide-y divide-gray-200">
                            {budgetModalData.items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-white/50 transition-colors duration-200 group">
                                    <td className="py-5 px-6 font-medium opacity-80">{item.date.split(' ')[0]}</td>
                                    <td className="py-5 px-6"><div className="font-bold text-lg mb-1">{item.name}</div>{item.note && <div className="text-sm opacity-60 bg-black/5 inline-block px-2 py-0.5 rounded">{item.note}</div>}</td>
                                    <td className="py-5 px-6 text-right font-mono text-slate-500">{item.currency} {item.cost.toLocaleString()}</td>
                                    <td className="py-5 px-6 text-right font-mono text-lg font-bold" style={{color: '#e11d48'}}>{homeCurr} {getConvertedValue(item.cost, item.currency).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 mt-16 mb-6"><div className="flex items-center gap-3 text-2xl font-bold" style={{color: currentTheme.textColor}}><i className="fas fa-route" style={{color: currentTheme.primaryColor}}></i><h2>每日詳細行程</h2></div></div>
      <div className="container mx-auto px-4 mb-8"><div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {itinerary?.days && itinerary.days.map((day) => (<button key={day.dayNumber} onClick={() => setActiveDay(day.dayNumber)} className={`px-6 py-3 rounded-xl font-bold transition-all shadow-sm whitespace-nowrap ${activeDay === day.dayNumber ? 'text-white shadow-lg scale-105' : 'bg-white text-gray-600 hover:bg-gray-50'}`} style={activeDay === day.dayNumber ? {backgroundColor: currentTheme.primaryColor} : {}} >Day {day.dayNumber}</button>))}
      </div></div>

      <div className="container mx-auto px-4">
        {currentDayData && (
          <div className="rounded-2xl shadow-xl p-8 border-l-8 animate-fadeIn" style={{backgroundColor: currentTheme.cardBg, borderColor: currentTheme.primaryColor}}>
            <div className="mb-8 border-b border-gray-200 pb-6">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Day {currentDayData.dayNumber}: {currentDayData.date}</h2>
                  <span className="inline-block bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-sm font-bold">{currentDayData.theme}</span>
                </div>
                <div className="w-full md:w-auto bg-white/50 p-4 rounded-xl border border-gray-200 flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{backgroundColor: currentTheme.primaryColor}}><i className="fas fa-bed"></i></div>
                   <div className="flex-1">
                      <div className="text-xs opacity-60 font-bold uppercase">住宿飯店 & 費用</div>
                      {isEditing ? (
                        <div className="flex flex-col md:flex-row gap-2 mt-1">
                            <input type="text" value={currentDayData.accommodation || ''} onChange={(e) => handleAccommodationChange(dayIndex, 'name', e.target.value)} className="bg-white border border-gray-300 rounded px-2 py-1 text-sm w-full md:w-48 focus:outline-none focus:border-blue-500" placeholder="飯店名稱"/>
                            <div className="flex items-center gap-1">
                                <select value={currentDayData.accommodation_currency || destCurr} onChange={(e) => handleAccommodationChange(dayIndex, 'currency', e.target.value)} className="bg-white border border-gray-300 rounded px-1 py-1 text-xs focus:outline-none">{CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}</select>
                                <input type="number" value={currentDayData.accommodation_cost || 0} onChange={(e) => handleAccommodationChange(dayIndex, 'cost', parseInt(e.target.value) || 0)} className="bg-white border border-gray-300 rounded px-2 py-1 text-sm w-24 focus:outline-none focus:border-blue-500" placeholder="費用"/>
                            </div>
                        </div>
                      ) : (
                        <div>
                            <div className="font-bold">{currentDayData.accommodation || '尚未安排住宿'}</div>
                            {currentDayData.accommodation_cost && currentDayData.accommodation_cost > 0 && (<div className="text-xs opacity-60 mt-1">預算: {formatMoney(currentDayData.accommodation_cost, currentDayData.accommodation_currency)}</div>)}
                        </div>
                      )}
                   </div>
                </div>
              </div>
              
              {/* 🌧️ 雨天備案 */}
              {currentDayData.alternatives && (
                <div className="mt-4 flex items-start gap-3 bg-sky-50 text-sky-700 px-5 py-3 rounded-xl">
                  <i className="fas fa-cloud-rain text-xl mt-0.5"></i>
                  <div>
                    <div className="font-bold text-sm">雨天備案</div>
                    <div className="text-sm opacity-80">{currentDayData.alternatives}</div>
                  </div>
                </div>
              )}
              
              {/* 📋 檢查清單 */}
              {currentDayData.checklist && currentDayData.checklist.length > 0 && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <i className="fas fa-clipboard-check text-amber-600"></i>
                    <span className="font-bold text-amber-800">今日檢查清單</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {currentDayData.checklist.map((item, idx) => (
                      <label key={idx} className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500" />
                        <span className="text-sm text-amber-900 group-hover:text-amber-700">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              {currentDayData.weather && <div className="mt-4 flex items-center gap-3 bg-amber-50 text-amber-600 px-5 py-3 rounded-xl w-fit"><i className={`fas ${currentDayData.weather.icon} text-2xl`}></i><div><div className="font-bold text-lg">{currentDayData.weather.temp}</div><div className="text-xs opacity-80">{currentDayData.weather.desc}</div></div></div>}
            </div>
            
            <div className="relative pl-8 border-l-2 border-gray-200 ml-4 space-y-10">
              {currentDayData.stops.map((stop, stopIndex) => {
                const prevStop = stopIndex > 0 ? currentDayData.stops[stopIndex - 1] : null;
                
                // 智慧導航連結 (Google Maps)
                let mapUrl = "";
                if (prevStop) {
                    const dateStr = currentDayData.date.split(' ')[0];
                    const dateTimeStr = `${dateStr}T${prevStop.time}:00`;
                    const departureTime = !isNaN(new Date(dateTimeStr).getTime()) 
                        ? Math.floor(new Date(dateTimeStr).getTime() / 1000) 
                        : undefined;
                    
                    mapUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(prevStop.name)}&destination=${encodeURIComponent(stop.name)}&travelmode=transit`;
                    if (departureTime) mapUrl += `&departure_time=${departureTime}`;
                } else {
                    mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.name + " 日本")}`;
                }

                return (
                  <div key={stopIndex} className="relative group">
                    <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-white shadow-sm z-10" style={{backgroundColor: currentTheme.primaryColor}}></div>
                    {isEditing && (<button onClick={() => handleDeleteStop(dayIndex, stopIndex)} className="absolute -right-2 -top-2 w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition shadow-sm z-20" title="刪除此行程"><i className="fas fa-trash-alt text-sm"></i></button>)}
                    <div className="inline-block bg-gray-100 text-gray-600 px-3 py-1 rounded-md text-sm font-mono font-bold mb-3">{isEditing ? (<input type="text" value={stop.time} onChange={(e) => handleStopChange(dayIndex, stopIndex, 'time', e.target.value)} onBlur={handleTimeBlur} className="w-20 bg-transparent border-b border-gray-400 focus:outline-none text-center"/>) : stop.time}</div>
                    <div className={`p-6 rounded-xl hover:shadow-md transition border bg-white/60 ${isEditing ? 'border-blue-200 border-dashed' : 'border-gray-100'}`}>
                      <div className="flex justify-between items-start">
                        {isEditing ? (
                            <input type="text" value={stop.name} onChange={(e) => handleStopChange(dayIndex, stopIndex, 'name', e.target.value)} className="w-full text-xl font-bold bg-white border p-2 rounded mb-2" placeholder="輸入地點名稱"/>
                        ) : (
                            <h3 className="text-xl font-bold flex items-center gap-3">
                                {stop.name}
                                <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition opacity-0 group-hover:opacity-100">
                                    <i className={`fas ${prevStop ? 'fa-route' : 'fa-map-marker-alt'}`}></i> {prevStop ? '導航去這裡 (含班次)' : '地圖'}
                                </a>
                            </h3>
                        )}
                      </div>
                      {(showTransport || isEditing) && (
                        <div className={`mt-3 rounded-lg text-sm ${isEditing ? 'bg-orange-50 p-3 border border-orange-100' : 'inline-block font-bold bg-orange-50 text-orange-600 px-3 py-2'}`}>
                           {isEditing ? (
                             <div className="flex flex-col gap-1">
                               {prevStop && (<div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><i className="fas fa-map-pin text-gray-400"></i><span>From: <strong>{prevStop.name}</strong></span><i className="fas fa-arrow-right text-gray-300 mx-1"></i><span>To: <strong>{stop.name}</strong></span></div>)}
                               <div className="flex items-center gap-2"><i className="fas fa-subway text-orange-500"></i><input type="text" value={stop.transport || ''} onChange={(e) => handleStopChange(dayIndex, stopIndex, 'transport', e.target.value)} className="flex-1 bg-white border border-orange-200 rounded px-2 py-1 text-orange-700 focus:outline-none focus:border-orange-500" placeholder={prevStop ? "留空以自動計算最佳交通" : "這是第一站 (無需交通)"}/></div>
                             </div>
                           ) : (
                              stop.transport && <span><i className="fas fa-subway mr-2"></i> {stop.transport}</span>
                           )}
                        </div>
                      )}
                      <div className="mt-3 opacity-80 leading-relaxed">
                        {/* 🏷️ 標籤顯示 */}
                        {!isEditing && stop.tags && stop.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {stop.tags.map((tag, tagIdx) => (
                              <TagBadge key={tagIdx} tag={tag} />
                            ))}
                          </div>
                        )}
                        {isEditing ? (
                          <div className="space-y-3 mt-2">
                            <textarea value={stop.description} onChange={(e) => handleStopChange(dayIndex, stopIndex, 'description', e.target.value)} className="w-full border p-2 rounded text-sm" rows={2} placeholder="行程備註"/>
                            <input 
                              type="text" 
                              value={(stop.tags || []).join(', ')} 
                              onChange={(e) => handleStopChange(dayIndex, stopIndex, 'tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))} 
                              className="w-full border p-2 rounded text-sm" 
                              placeholder="標籤 (用逗號分隔，如: 📷 攝影點, 🚁 可空拍, 🌸 必訪)"
                            />
                            <div className="flex items-center gap-2">
                              <select value={stop.currency || destCurr} onChange={(e) => handleStopChange(dayIndex, stopIndex, 'currency', e.target.value)} className="bg-white border border-gray-300 rounded px-1 py-1 text-xs focus:outline-none">{CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}</select>
                              <input type="number" value={stop.cost} onChange={(e) => handleStopChange(dayIndex, stopIndex, 'cost', parseInt(e.target.value) || 0)} className="border p-1 rounded w-32"/>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p>{stop.description}</p>
                            {stop.cost > 0 && (<div className="mt-2 font-bold opacity-100 flex items-center gap-2"><i className="fas fa-coins text-yellow-500"></i> {formatMoney(stop.cost, stop.currency)}</div>)}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {isEditing && (<div onClick={() => handleAddStop(dayIndex)} className="relative pl-0 cursor-pointer group opacity-60 hover:opacity-100 transition-opacity mt-4"><div className="absolute -left-[35px] top-3 w-3 h-3 bg-gray-300 rounded-full border-2 border-white group-hover:bg-blue-500 transition-colors"><i className="fas fa-plus-circle text-xl"></i></div><div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex items-center justify-center gap-2 text-gray-500 group-hover:border-blue-400 group-hover:text-blue-500 group-hover:bg-blue-50 transition-all"><i className="fas fa-plus-circle text-xl"></i><span className="font-bold">新增此日行程 (自動排序)</span></div></div>)}
            </div>
          </div>
        )}
      </div>
      
      {/* 已移除底部地圖區塊 */}
      
      <div className="container mx-auto px-4 mt-16 mb-20">
        <div className="flex items-center gap-3 text-2xl font-bold mb-8" style={{color: currentTheme.textColor}}>
          <i className="fas fa-tools"></i>
          <h2>工具與下載</h2>
        </div>
        <div className="p-8 rounded-2xl shadow-lg border border-gray-100" style={{backgroundColor: currentTheme.cardBg}}>
          <h3 className="text-lg font-bold mb-4 border-l-4 pl-3" style={{borderColor: currentTheme.primaryColor}}>快速修改指南</h3>
          <ul className="list-disc pl-6 space-y-2 opacity-80 mb-8">
            <li><strong>加站</strong>：若體力充沛，可在 Day 3 下午加入「仙台城跡」或「大崎八幡宮」</li>
            <li><strong>減站</strong>：若想更輕鬆，可省略「觀音寺川」或「伊佐須美神社」</li>
            <li><strong>改交通</strong>：可考慮利用飯店宅配服務將大件行李直接寄送至下一站飯店</li>
            <li><strong>改時程</strong>：每日出發時間可彈性延後至9:30或10:00，保持輕鬆節奏</li>
          </ul>
          
          <div className="flex gap-4 flex-wrap">
            <button onClick={() => window.print()} className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition shadow-lg flex items-center gap-2">
              <i className="fas fa-print"></i> 列印行程
            </button>
            <a href={`${API_BASE}/api/export`} target="_blank" rel="noopener noreferrer" className="px-6 py-3 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 transition hover:opacity-90" style={{backgroundColor: currentTheme.primaryColor}}>
              <i className="fas fa-file-excel"></i> 匯出 Excel 報表
            </a>
            <a href="/tohoku_trip_2026.html" target="_blank" className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 transition hover:opacity-90">
              <i className="fas fa-file-code"></i> 查看 HTML 行程表
            </a>
          </div>
        </div>
      </div>
      {/* 功能面板切換按鈕 */}
      <button 
        onClick={() => setShowFeatures(!showFeatures)}
        className='fixed bottom-4 right-4 bg-pink-500 text-white p-3 rounded-full shadow-lg z-50'
      >
        🎯 工具箱
      </button>
      
      {/* 功能面板 */}
      {showFeatures && (
        <div className='fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4'>
          <div className='bg-gray-100 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-4'>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-xl font-bold'>🎯 旅遊工具箱</h2>
              <button onClick={() => setShowFeatures(false)} className='text-2xl'>✕</button>
            </div>
            <FeaturePanel />
          </div>
        </div>
      )}
    </main>
  );
}