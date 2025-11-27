import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, 
  Navigation, 
  CloudSun, 
  Utensils, 
  Train, 
  Camera, 
  Plane, 
  Bed, 
  Phone, 
  Wallet, 
  Plus, 
  Trash2, 
  ChevronRight, 
  Snowflake,
  Info,
  Calendar,
  CreditCard,
  X, 
  Save,
  Edit2, // 新增編輯圖示
  Map,   // 新增地址圖示
  FileText // 新增描述圖示
} from 'lucide-react';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp,
  setDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  getDoc 
} from 'firebase/firestore';

// --- Configuration: Fixed Date Range ---
const TRIP_DATES = [
  { day: 1, date: "1/28 (三)", fullDate: "2026-01-28", location: "首爾抵達", defaultWeather: { temp: "-2°C", condition: "Cloudy", icon: "cloud" } },
  { day: 2, date: "1/29 (四)", fullDate: "2026-01-29", location: "首爾市區", defaultWeather: { temp: "-5°C", condition: "Sunny", icon: "sun" } },
  { day: 3, date: "1/30 (五)", fullDate: "2026-01-30", location: "滑雪場", defaultWeather: { temp: "-8°C", condition: "Snow", icon: "snow" } },
  { day: 4, date: "1/31 (六)", fullDate: "2026-01-31", location: "首爾購物", defaultWeather: { temp: "-3°C", condition: "Cloudy", icon: "cloud" } },
  { day: 5, date: "2/01 (日)", fullDate: "2026-02-01", location: "自由活動", defaultWeather: { temp: "0°C", condition: "Sunny", icon: "sun" } },
  { day: 6, date: "2/02 (一)", fullDate: "2026-02-02", location: "返程", defaultWeather: { temp: "2°C", condition: "Sunny", icon: "sun" } },
];

// --- Constants ---
const KRW_TO_TWD_RATE = 0.024; // 匯率設定：1 韓元 = 0.024 台幣

// --- Firebase Configuration & Initialization ---
const firebaseConfig = {
  apiKey: "AIzaSyDQF7qJgpfKI5tWgOeYJbuU6UM7yrDn6jU",
  authDomain: "seoul-trip-e1b36.firebaseapp.com",
  projectId: "seoul-trip-e1b36",
  storageBucket: "seoul-trip-e1b36.firebasestorage.app",
  messagingSenderId: "206367773846",
  appId: "1:206367773846:web:0ad35c13c9e76045a01eb7"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "seoul-2026"; 

// --- Components ---

const Tag = ({ children, color }) => {
  const colorClasses = {
    red: "bg-red-50 text-red-700 border-red-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
    gray: "bg-stone-100 text-stone-600 border-stone-200",
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${colorClasses[color] || colorClasses.gray} font-medium tracking-wide mr-2 mb-1 inline-block`}>
      {children}
    </span>
  );
};

// 1. 修改後的行程卡片：隱藏描述，點擊開啟詳情
const ActivityCard = ({ activity, onClick }) => {
  const iconMap = {
    food: <Utensils size={16} className="text-orange-400" />,
    transport: <Train size={16} className="text-blue-400" />,
    sight: <Camera size={16} className="text-emerald-400" />,
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 mb-3 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all hover:shadow-md"
    >
      {/* Timeline Connector */}
      <div className="absolute left-4 top-0 bottom-0 w-[1px] bg-stone-100 -z-10" />

      <div className="flex items-start gap-3">
        {/* Time & Icon */}
        <div className="flex flex-col items-center gap-2 min-w-[50px]">
          <span className="text-xs font-semibold text-stone-400 font-mono">{activity.time}</span>
          <div className="w-8 h-8 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center z-10">
            {iconMap[activity.type] || <MapPin size={16} />}
          </div>
        </div>

        {/* Content (預覽模式) */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-stone-800 text-lg leading-tight mb-1 truncate">{activity.title}</h3>
          </div>
          
          <div className="text-xs text-stone-400 mb-2 flex items-center gap-1">
             <MapPin size={10} /> {activity.location}
          </div>

          {/* 顯示攻略筆記 (Highlights) */}
          {activity.highlights && activity.highlights.length > 0 && (
            <div className="bg-orange-50/50 rounded-lg p-2 text-xs text-stone-600 border border-orange-100/50">
              <div className="font-bold text-orange-400 mb-1 flex items-center gap-1 text-[10px]">
                <Info size={10} /> 攻略重點
              </div>
              <ul className="list-disc list-inside space-y-0.5 truncate">
                {activity.highlights.slice(0, 2).map((h, i) => (
                   <span key={i} className="mr-2">• {h}</span>
                ))}
                {activity.highlights.length > 2 && <span>...</span>}
              </ul>
            </div>
          )}
        </div>
        
        <div className="self-center">
            <ChevronRight size={16} className="text-stone-300" />
        </div>
      </div>
    </div>
  );
};

// 新增：詳細資訊 Modal (懸浮頁面)
const ActivityDetailModal = ({ activity, isOpen, onClose, onEdit }) => {
  if (!isOpen || !activity) return null;

  const handleNavClick = () => {
    // 優先使用地址，沒有則使用地點名稱
    const query = encodeURIComponent(activity.address || activity.location);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-md h-[85vh] sm:h-auto sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-y-auto flex flex-col animate-slideUp" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-stone-50 p-6 pb-8 border-b border-stone-100 relative">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-stone-200 rounded-full sm:hidden"></div>
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm text-stone-400 hover:text-stone-800">
                <X size={20} />
            </button>
            <div className="text-sm font-bold text-blue-600 mb-2 tracking-wide uppercase">{activity.type === 'food' ? '美食' : activity.type === 'transport' ? '交通' : '景點'} • {activity.time}</div>
            <h2 className="text-3xl font-bold text-stone-900 leading-tight">{activity.title}</h2>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 flex-1">
            
            {/* 地點與導航 */}
            <div className="space-y-3">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-stone-100 rounded-lg shrink-0"><MapPin size={20} className="text-stone-600"/></div>
                    <div>
                        <div className="font-bold text-stone-800">{activity.location}</div>
                        {activity.address && <div className="text-sm text-stone-500 mt-1">{activity.address}</div>}
                    </div>
                </div>
                <button 
                    onClick={handleNavClick}
                    className="flex items-center justify-center gap-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 w-full py-3 rounded-xl transition-colors shadow-blue-200 shadow-lg"
                >
                    <Navigation size={16} /> 開啟 Google Map 導航
                </button>
            </div>

            <hr className="border-stone-100" />

            {/* 描述 */}
            {activity.description && (
                <div>
                    <h4 className="font-bold text-stone-800 mb-2 flex items-center gap-2">
                        <FileText size={18} className="text-stone-400"/> 
                        詳細說明
                    </h4>
                    <p className="text-stone-600 leading-relaxed whitespace-pre-wrap">{activity.description}</p>
                </div>
            )}

            {/* 攻略筆記 */}
            {activity.highlights && activity.highlights.length > 0 && (
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                     <h4 className="font-bold text-orange-600 mb-3 flex items-center gap-2">
                        <Info size={18} /> 
                        攻略筆記
                    </h4>
                    <ul className="space-y-2">
                        {activity.highlights.map((h, i) => (
                             <li key={i} className="flex items-start gap-2 text-stone-700 text-sm">
                                <span className="text-orange-400 mt-1">•</span>
                                {h}
                             </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-100 flex gap-3 bg-stone-50/50">
            <button 
                onClick={() => { onClose(); onEdit(activity); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-stone-200 text-stone-700 font-bold rounded-xl hover:bg-stone-50"
            >
                <Edit2 size={18} /> 編輯行程
            </button>
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
        }
        .animate-slideUp {
            animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
};

// 2. 更新後的表單 Modal：支援新增與編輯、地址、攻略筆記
const ActivityFormModal = ({ isOpen, onClose, onSave, dateLabel, initialData }) => {
  const [formData, setFormData] = useState({
    time: '10:00',
    title: '',
    type: 'sight',
    description: '',
    location: '',
    address: '', // 新增地址
    highlightsStr: '' // 用字串來處理多行攻略
  });

  // 當開啟或 initialData 改變時，重置表單
  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            // 編輯模式：填入現有資料
            setFormData({
                ...initialData,
                highlightsStr: initialData.highlights ? initialData.highlights.join('\n') : ''
            });
        } else {
            // 新增模式：重置
            setFormData({ time: '10:00', title: '', type: 'sight', description: '', location: '', address: '', highlightsStr: '' });
        }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 將攻略筆記字串轉回陣列 (過濾空行)
    const highlights = formData.highlightsStr.split('\n').map(s => s.trim()).filter(s => s !== '');

    const activityData = {
      id: initialData ? initialData.id : Date.now().toString(), // 編輯用原 ID，新增用新 ID
      time: formData.time,
      title: formData.title,
      type: formData.type,
      description: formData.description,
      location: formData.location,
      address: formData.address,
      highlights: highlights,
      tags: [] 
    };
    
    onSave(activityData, !!initialData); // 第二個參數表示是否為編輯模式
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
        <div className="bg-stone-800 text-white p-4 flex justify-between items-center sticky top-0 z-10">
          <h3 className="font-bold">{initialData ? '編輯行程' : '新增活動'} - {dateLabel}</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <input 
              type="time" 
              required
              value={formData.time}
              onChange={e => setFormData({...formData, time: e.target.value})}
              className="p-2 border rounded-lg bg-stone-50"
            />
            <select 
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value})}
              className="col-span-2 p-2 border rounded-lg bg-stone-50"
            >
              <option value="sight">景點 (Sight)</option>
              <option value="food">美食 (Food)</option>
              <option value="transport">交通 (Transport)</option>
            </select>
          </div>

          <div className="space-y-1">
             <label className="text-xs text-stone-400 font-bold ml-1">標題</label>
             <input 
                placeholder="例: 廣藏市場"
                required
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full p-2 border rounded-lg bg-stone-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
                 <label className="text-xs text-stone-400 font-bold ml-1">地點名稱</label>
                 <input 
                    placeholder="例: 首爾塔"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    className="w-full p-2 border rounded-lg bg-stone-50"
                />
            </div>
             <div className="space-y-1">
                 <label className="text-xs text-stone-400 font-bold ml-1">地址 (導航用)</label>
                 <input 
                    placeholder="例: 105 Namsangongwon"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    className="w-full p-2 border rounded-lg bg-stone-50"
                />
            </div>
          </div>
          
          <div className="space-y-1">
             <label className="text-xs text-stone-400 font-bold ml-1">詳細描述</label>
             <textarea 
                placeholder="描述與備註..."
                rows={2}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full p-2 border rounded-lg bg-stone-50"
            />
          </div>

          <div className="space-y-1">
             <label className="text-xs text-orange-400 font-bold ml-1">攻略筆記 (一行一點)</label>
             <textarea 
                placeholder="必點：綠豆煎餅&#10;記得帶現金"
                rows={3}
                value={formData.highlightsStr}
                onChange={e => setFormData({...formData, highlightsStr: e.target.value})}
                className="w-full p-2 border rounded-lg bg-orange-50 border-orange-100"
            />
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 mt-4">
            <Save size={18} /> {initialData ? '更新行程' : '儲存行程'}
          </button>
        </form>
      </div>
    </div>
  );
};

const WeatherWidget = ({ weather, location }) => (
  <div className="flex items-center justify-between bg-gradient-to-r from-stone-800 to-stone-700 text-white p-4 rounded-xl mb-6 shadow-md">
    <div>
      <div className="text-xs text-stone-300 mb-1 flex items-center gap-1">
        <MapPin size={10} /> {location}
      </div>
      <div className="text-2xl font-light tracking-wider">{weather.temp}</div>
      <div className="text-xs text-stone-300">{weather.condition}</div>
    </div>
    {weather.icon === 'snow' ? <Snowflake size={32} className="text-blue-200 animate-pulse" /> : <CloudSun size={32} className="text-yellow-200" />}
  </div>
);

// 3. 更新後的記帳工具：顯示匯率與台幣換算
// --- Updated Budget Tool with Real-time Rate ---
const BudgetTool = ({ user }) => {
  const [items, setItems] = useState([]);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [cat, setCat] = useState('food');
  const [loading, setLoading] = useState(false);
  
  // 新增：匯率狀態 (預設給一個大概的值 0.023，避免 API 掛掉時顯示 0)
  const [exchangeRate, setExchangeRate] = useState(0.023);
  const [isRateLoading, setIsRateLoading] = useState(true);

  // 1. 抓取即時匯率 (含快取機制)
  useEffect(() => {
    const fetchRate = async () => {
      // 檢查 LocalStorage 是否有今天的快取
      const cachedData = localStorage.getItem('exchange_rate_cache');
      const today = new Date().toISOString().split('T')[0]; // 取得 "2024-01-28" 格式

      if (cachedData) {
        const { date, rate } = JSON.parse(cachedData);
        if (date === today) {
          console.log("使用快取匯率:", rate);
          setExchangeRate(rate);
          setIsRateLoading(false);
          return;
        }
      }

      // 如果沒有快取或過期，則呼叫 API
      try {
        console.log("呼叫匯率 API...");
        const response = await fetch('https://api.frankfurter.app/latest?from=KRW&to=TWD');
        const data = await response.json();
        
        if (data && data.rates && data.rates.TWD) {
          const newRate = data.rates.TWD;
          setExchangeRate(newRate);
          
          // 存入快取
          localStorage.setItem('exchange_rate_cache', JSON.stringify({
            date: today,
            rate: newRate
          }));
        }
      } catch (error) {
        console.error("匯率抓取失敗，使用預設值:", error);
      } finally {
        setIsRateLoading(false);
      }
    };

    fetchRate();
  }, []);

  // 2. Fetch expenses (原本的邏輯)
  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'artifacts', appId, 'users', user.uid, 'expenses');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setItems(data);
    }, (error) => {
        console.error("Firestore Error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!desc || !amount || !user) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'expenses'), {
        desc,
        amount: parseFloat(amount),
        category: cat,
        createdAt: serverTimestamp()
      });
      setDesc('');
      setAmount('');
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'expenses', id));
    } catch (err) {
      console.error(err);
    }
  };

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-stone-400 text-xs font-bold uppercase tracking-widest">預算管理 (Budget)</h3>
            
            {/* 匯率顯示小標籤 */}
            <div className="flex items-center gap-2">
              {isRateLoading && <div className="animate-spin w-3 h-3 border-2 border-stone-300 border-t-blue-500 rounded-full"></div>}
              <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-1 rounded">
                匯率: {exchangeRate.toFixed(4)}
              </span>
            </div>
        </div>
        
        <div className="mb-6">
            <div className="text-3xl font-light text-stone-800">
                ₩ {total.toLocaleString()}
            </div>
            <div className="text-sm text-stone-400 font-medium mt-1">
                ≈ NT$ {Math.round(total * exchangeRate).toLocaleString()}
            </div>
        </div>

        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <input 
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="項目"
              className="col-span-2 p-3 bg-stone-50 rounded-lg text-sm outline-none focus:ring-1 focus:ring-stone-300"
            />
            <select 
              value={cat}
              onChange={e => setCat(e.target.value)}
              className="p-3 bg-stone-50 rounded-lg text-sm outline-none"
            >
              <option value="food">食</option>
              <option value="transport">行</option>
              <option value="shop">購</option>
              <option value="other">他</option>
            </select>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-3 text-stone-400 text-sm">₩</span>
              <input 
                type="number" 
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="金額"
                className="w-full p-3 pl-8 bg-stone-50 rounded-lg text-sm outline-none focus:ring-1 focus:ring-stone-300"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-stone-800 text-white px-4 rounded-lg flex items-center justify-center disabled:opacity-50"
            >
              <Plus size={20} />
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="flex justify-between items-center bg-white p-4 rounded-xl border border-stone-100">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${
                item.category === 'food' ? 'bg-orange-400' : 
                item.category === 'transport' ? 'bg-blue-400' :
                item.category === 'shop' ? 'bg-purple-400' : 'bg-stone-400'
              }`} />
              <div className="flex flex-col">
                  <span className="text-stone-700 font-medium">{item.desc}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-stone-800 font-mono text-sm">₩{item.amount.toLocaleString()}</div>
                <div className="text-stone-400 text-xs font-medium">NT$ {Math.round(item.amount * exchangeRate).toLocaleString()}</div>
              </div>
              <button onClick={() => handleDelete(item.id)} className="text-stone-300 hover:text-red-400">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center text-stone-400 text-sm py-8">尚未新增任何支出</div>
        )}
      </div>
    </div>
  );
};

// --- Main App Component ---


const InfoCard = ({ icon: Icon, title, content, subContent, colorClass }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 flex items-start gap-4">
    <div className={`p-3 rounded-full ${colorClass} bg-opacity-10 shrink-0`}>
      <Icon size={20} className={colorClass.replace('bg-', 'text-')} />
    </div>
    <div>
      <h4 className="font-bold text-stone-800 mb-1">{title}</h4>
      <p className="text-stone-600 text-sm mb-1">{content}</p>
      {subContent && <p className="text-stone-400 text-xs">{subContent}</p>}
      {subContent && (
        <p className="text-stone-400 text-xs whitespace-pre-wrap">
          {subContent}
        </p>
      )}
    </div>
  </div>
);


const App = () => {
  const [activeTab, setActiveTab] = useState('itinerary');
  const [currentDayIndex, setCurrentDayIndex] = useState(0); 
  const [user, setUser] = useState(null);
  
  const [activitiesMap, setActivitiesMap] = useState({});
  // 控制 Form Modal (新增/編輯共用)
  const [formModalOpen, setFormModalOpen] = useState(false);
  // 控制 Detail Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  
  // 紀錄當前正在操作的 Activity
  const [selectedActivity, setSelectedActivity] = useState(null); 
  // 紀錄當前要編輯的資料 (如果為 null 則為新增模式)
  const [editingData, setEditingData] = useState(null);

  // Auth Effect
  useEffect(() => {
    const initAuth = async () => {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      };
      initAuth();
      const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
      return () => unsubscribe();
  }, []);

  // Firestore 監聽
  useEffect(() => {
    const q = collection(db, 'artifacts', appId, 'itineraries');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMap = {};
      snapshot.forEach(doc => {
        newMap[doc.id] = doc.data().activities || [];
      });
      setActivitiesMap(newMap);
    }, (err) => console.log("Firestore sync error:", err)); // 避免沒資料時報錯
    return () => unsubscribe();
  }, []);

  const currentDayConfig = TRIP_DATES[currentDayIndex];
  
  const currentDayFirestoreData = activitiesMap[currentDayConfig.fullDate];
  const currentWeather = currentDayFirestoreData?.weather || currentDayConfig.defaultWeather;
  const currentActivities = (currentDayFirestoreData || []).sort((a, b) => 
    a.time.localeCompare(b.time)
  );

  // 打開詳細頁面
  const handleOpenDetail = (activity) => {
    setSelectedActivity(activity);
    setDetailModalOpen(true);
  };

  // 打開新增視窗
  const handleOpenAdd = () => {
    setEditingData(null); // 清空編輯資料代表新增
    setFormModalOpen(true);
  };

  // 從詳細頁面切換到編輯視窗
  const handleOpenEdit = (activity) => {
    setDetailModalOpen(false); // 關閉詳細
    setEditingData(activity); // 設定編輯對象
    setFormModalOpen(true); // 開啟編輯
  };

  // 處理儲存 (新增或更新)
  const handleSaveActivity = async (activityData, isEditMode) => {
    if (!user) {
      alert("請先登入或等待連線...");
      return;
    }
    
    const dateDocId = currentDayConfig.fullDate;
    const docRef = doc(db, 'artifacts', appId, 'itineraries', dateDocId);

    try {
      if (isEditMode) {
        // 編輯模式：先刪除舊的，再加入新的 (因為 Firestore 陣列更新不易)
        // 注意：這裡需要取得完整的新陣列
        const updatedActivities = currentActivities.filter(a => a.id !== activityData.id);
        updatedActivities.push(activityData);
        
        await setDoc(docRef, {
            activities: updatedActivities
        }, { merge: true });

      } else {
        // 新增模式
        await setDoc(docRef, {
            activities: arrayUnion(activityData)
        }, { merge: true });
      }
      
      setFormModalOpen(false);
    } catch (error) {
      console.error("Error saving activity:", error);
      alert("儲存失敗，請檢查網路");
    }
  };

  const handleDeleteActivity = async (activityToDelete) => {
    if(!confirm("確定要刪除這個行程嗎？")) return;
    const dateDocId = currentDayConfig.fullDate;
    const docRef = doc(db, 'artifacts', appId, 'itineraries', dateDocId);
    try {
        await updateDoc(docRef, {
            activities: arrayRemove(activityToDelete)
        });
        setDetailModalOpen(false); // 關閉詳細頁
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans pb-24 sm:pb-0 sm:pl-20 text-stone-800">
      
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-100 px-6 py-4 flex justify-between items-center sm:hidden">
        <h1 className="text-lg font-bold tracking-tight text-stone-800">SEOUL 2026</h1>
        <div className="text-xs text-stone-400 bg-stone-100 px-2 py-1 rounded">Ski Trip</div>
      </div>

      {/* Sidebar Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-6 py-3 z-50 sm:top-0 sm:bottom-auto sm:right-auto sm:w-20 sm:h-screen sm:flex-col sm:border-t-0 sm:border-r sm:py-8 sm:px-0 flex justify-around items-center sm:justify-start sm:gap-8">
         <button 
          onClick={() => setActiveTab('itinerary')}
          className={`flex flex-col items-center gap-1 sm:w-full sm:py-2 transition-colors ${activeTab === 'itinerary' ? 'text-stone-900' : 'text-stone-400'}`}
        >
          <Calendar size={24} strokeWidth={activeTab === 'itinerary' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">行程</span>
        </button>
        <button 
          onClick={() => setActiveTab('tools')}
          className={`flex flex-col items-center gap-1 sm:w-full sm:py-2 transition-colors ${activeTab === 'tools' ? 'text-stone-900' : 'text-stone-400'}`}
        >
          <Wallet size={24} strokeWidth={activeTab === 'tools' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">工具</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-md mx-auto sm:max-w-2xl sm:mx-0 sm:ml-auto p-4 sm:p-8">
        
        {activeTab === 'itinerary' && (
          <div className="space-y-6 fade-in">
            {/* Day Selector */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {TRIP_DATES.map((d, index) => (
                <button
                  key={d.day}
                  onClick={() => setCurrentDayIndex(index)}
                  className={`flex-shrink-0 px-5 py-3 rounded-xl transition-all ${
                    currentDayIndex === index 
                      ? 'bg-stone-800 text-white shadow-lg scale-105' 
                      : 'bg-white text-stone-400 border border-stone-100 hover:bg-stone-50'
                  }`}
                >
                  <div className="text-xs opacity-60">Day {d.day}</div>
                  <div className="font-bold whitespace-nowrap">{d.date.split(' ')[0]}</div>
                </button>
              ))}
            </div>

            <WeatherWidget weather={currentWeather} location={currentDayConfig.location} />

            <div className="space-y-0 min-h-[200px]">
              {currentActivities.length === 0 ? (
                <div className="text-center py-10 text-stone-400 border-2 border-dashed border-stone-200 rounded-xl">
                  <p>這一天還沒有安排行程</p>
                  <p className="text-xs mt-1">點擊下方按鈕開始規劃</p>
                </div>
              ) : (
                currentActivities.map(activity => (
                  <div key={activity.id} className="relative group">
                     {/* 傳遞點擊事件以打開詳細頁 */}
                     <ActivityCard 
                        activity={activity} 
                        onClick={() => handleOpenDetail(activity)}
                     />
                     <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteActivity(activity); }}
                        className="absolute top-2 right-2 p-2 bg-white/90 rounded-full text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-20"
                     >
                        <Trash2 size={14} />
                     </button>
                  </div>
                ))
              )}
            </div>

            <button 
              onClick={handleOpenAdd}
              className="fixed bottom-20 right-6 sm:bottom-10 sm:right-10 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg shadow-blue-200 transition-transform active:scale-90 z-30 flex items-center gap-2"
            >
              <Plus size={24} />
              <span className="font-bold pr-1 sm:hidden">新增</span>
            </button>
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="space-y-8 fade-in">
             <section>
              <h2 className="text-xl font-bold mb-4 px-1">旅程資訊</h2>
              <div className="grid gap-4">
                <InfoCard 
                  icon={Plane}
                  title="去程航班 LJ736"
                  content="2026/01/28 | RMQ 11:00 -> ICN 14:40"
                  subContent="第一航廈/經濟艙/行李 15kg"
                  colorClass="bg-blue-500 text-blue-500"
                />
                 <InfoCard 
                  icon={Plane}
                  title="回程航班 LJ737"
                  content="2026/02/02 | ICN 15:20 -> RMQ 17:30"
                  subContent="第二航廈/經濟艙/行李 15kg"
                  colorClass="bg-blue-500 text-blue-500"
                />
                <InfoCard
                  icon={Bed}
                  title="住宿資訊"
                  content="Fraser Place Central Seoul"
                  subContent="地址: 78, Tongil-ro, Jung District, Seoul | 電話: +82 2-2220-8888\n入住: 2026/01/28 15:00 | 退房: 2026/02/02 11:00"
                  colorClass="bg-green-500 text-green-500"
                  ></InfoCard>
                <InfoCard 
                  icon={Phone}
                  title="緊急聯絡"
                  content="外交部旅外救助: +82-10-9093-8738"
                  subContent="韓國報警 112 / 火警 119"
                  colorClass="bg-red-500 text-red-500"
                />

              </div>
            </section>
            
            <section>
              <h2 className="text-xl font-bold mb-4 px-1 flex items-center gap-2">
                <CreditCard size={20} />
                記帳小幫手
              </h2>
              {user ? <BudgetTool user={user} /> : <div className="p-4 text-center">Loading...</div>}
            </section>
          </div>
        )}

      </main>

      {/* Modals */}
      <ActivityFormModal 
        isOpen={formModalOpen} 
        onClose={() => setFormModalOpen(false)} 
        onSave={handleSaveActivity}
        dateLabel={currentDayConfig.date}
        initialData={editingData} // 傳入要編輯的資料
      />

      <ActivityDetailModal 
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        activity={selectedActivity}
        onEdit={handleOpenEdit} // 傳入編輯函式
      />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;