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
  CreditCard
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
import { X, Save } from 'lucide-react'; // 新增圖示

// --- Configuration: Fixed Date Range ---
const TRIP_DATES = [
  { day: 1, date: "1/28 (三)", fullDate: "2026-01-28", location: "首爾抵達", defaultWeather: { temp: "-2°C", condition: "Cloudy", icon: "cloud" } },
  { day: 2, date: "1/29 (四)", fullDate: "2026-01-29", location: "首爾市區", defaultWeather: { temp: "-5°C", condition: "Sunny", icon: "sun" } },
  { day: 3, date: "1/30 (五)", fullDate: "2026-01-30", location: "滑雪場", defaultWeather: { temp: "-8°C", condition: "Snow", icon: "snow" } },
  { day: 4, date: "1/31 (六)", fullDate: "2026-01-31", location: "首爾購物", defaultWeather: { temp: "-3°C", condition: "Cloudy", icon: "cloud" } },
  { day: 5, date: "2/01 (日)", fullDate: "2026-02-01", location: "自由活動", defaultWeather: { temp: "0°C", condition: "Sunny", icon: "sun" } },
  { day: 6, date: "2/02 (一)", fullDate: "2026-02-02", location: "返程", defaultWeather: { temp: "2°C", condition: "Sunny", icon: "sun" } },
];

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

const ActivityCard = ({ activity }) => {
  const iconMap = {
    food: <Utensils size={16} className="text-orange-400" />,
    transport: <Train size={16} className="text-blue-400" />,
    sight: <Camera size={16} className="text-emerald-400" />,
  };

  const handleNavClick = () => {
    // Mobile-first navigation logic
    const query = encodeURIComponent(activity.location);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 mb-4 relative overflow-hidden group">
      {/* Timeline Connector (Visual only) */}
      <div className="absolute left-4 top-0 bottom-0 w-[1px] bg-stone-100 -z-10" />

      <div className="flex items-start gap-4">
        {/* Time & Icon */}
        <div className="flex flex-col items-center gap-2 min-w-[50px]">
          <span className="text-xs font-semibold text-stone-400 font-mono">{activity.time}</span>
          <div className="w-8 h-8 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center z-10">
            {iconMap[activity.type] || <MapPin size={16} />}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-stone-800 text-lg leading-tight mb-1">{activity.title}</h3>
          </div>
          
          <p className="text-sm text-stone-500 mb-3 leading-relaxed">{activity.description}</p>

          {/* Smart Tags / Highlights */}
          <div className="flex flex-wrap mb-2">
            {activity.tags?.map((tag, i) => (
              <Tag key={i} color={tag.color}>{tag.label}</Tag>
            ))}
          </div>

          {/* Guide Highlights (Story/Strategy) */}
          {activity.highlights && (
            <div className="bg-stone-50 rounded-lg p-3 text-xs text-stone-600 mb-3 border border-stone-100/50">
              <div className="font-bold text-stone-400 mb-1 flex items-center gap-1">
                <Info size={10} /> 攻略筆記
              </div>
              <ul className="list-disc list-inside space-y-1">
                {activity.highlights.map((h, i) => (
                  <li key={i}>
                    <span dangerouslySetInnerHTML={{ 
                      __html: h.replace(/(必吃|必買|必點)/g, '<span class="text-red-500 font-bold">$1</span>') 
                    }} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Navigation Button */}
          <button 
            onClick={handleNavClick}
            className="flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50/50 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors w-full justify-center sm:w-auto mt-2"
          >
            <Navigation size={14} />
            開始導航 ({activity.location})
          </button>
        </div>
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

// --- Budget Tool (Firebase Integrated) ---
const BudgetTool = ({ user }) => {
  const [items, setItems] = useState([]);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [cat, setCat] = useState('food');
  const [loading, setLoading] = useState(false);

  // Fetch expenses
  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'artifacts', appId, 'users', user.uid, 'expenses');
    // Rule 2: No complex ordering in query to prevent index errors for this demo
    // We will sort in client side
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Client side sort by created time
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
        <h3 className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-4">預算管理 (Budget)</h3>
        <div className="text-3xl font-light text-stone-800 mb-6">
          ₩ {total.toLocaleString()}
          <span className="text-sm text-stone-400 ml-2">已支出</span>
        </div>

        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <input 
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="項目 (如: 晚餐)"
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
                item.category === 'transport' ? 'bg-blue-400' : 'bg-stone-400'
              }`} />
              <span className="text-stone-700 font-medium">{item.desc}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-stone-600 font-mono">₩{item.amount.toLocaleString()}</span>
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

const InfoCard = ({ icon: Icon, title, content, subContent, colorClass }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 flex items-start gap-4">
    <div className={`p-3 rounded-full ${colorClass} bg-opacity-10 shrink-0`}>
      <Icon size={20} className={colorClass.replace('bg-', 'text-')} />
    </div>
    <div>
      <h4 className="font-bold text-stone-800 mb-1">{title}</h4>
      <p className="text-stone-600 text-sm mb-1">{content}</p>
      {subContent && <p className="text-stone-400 text-xs">{subContent}</p>}
    </div>
  </div>
);

const AddActivityModal = ({ isOpen, onClose, onSave, dateLabel }) => {
  const [formData, setFormData] = useState({
    time: '10:00',
    title: '',
    type: 'sight',
    description: '',
    location: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const newActivity = {
      id: Date.now().toString(),
      ...formData,
      tags: [],
      highlights: []
    };
    onSave(newActivity);
    // 重置表單
    setFormData({ time: '10:00', title: '', type: 'sight', description: '', location: '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-fadeIn">
        <div className="bg-stone-800 text-white p-4 flex justify-between items-center">
          <h3 className="font-bold">新增活動至 {dateLabel}</h3>
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
          <input 
            placeholder="標題 (例: 廣藏市場)"
            required
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
            className="w-full p-2 border rounded-lg bg-stone-50"
          />
          <input 
            placeholder="地點 (Google Map 搜尋用)"
            value={formData.location}
            onChange={e => setFormData({...formData, location: e.target.value})}
            className="w-full p-2 border rounded-lg bg-stone-50"
          />
          <textarea 
            placeholder="描述與備註..."
            rows={3}
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            className="w-full p-2 border rounded-lg bg-stone-50"
          />
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
            <Save size={18} /> 儲存行程
          </button>
        </form>
      </div>
    </div>
  );
};

// --- Main App Component ---

const App = () => {
  const [activeTab, setActiveTab] = useState('itinerary');
  const [currentDayIndex, setCurrentDayIndex] = useState(0); // 改用 Index 控制比較方便 (0-5)
  const [user, setUser] = useState(null);
  
  // 新增：行程資料狀態 (Map 結構: dateString -> activities array)
  const [activitiesMap, setActivitiesMap] = useState({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Auth Effect (保持不變)
  useEffect(() => {
    // ... (原本的 Auth 程式碼) ...
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

  // 新增：Firestore 行程監聽器
  useEffect(() => {
    // 監聽 artifacts/{appId}/itineraries 下的所有文件
    const q = collection(db, 'artifacts', appId, 'itineraries');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMap = {};
      snapshot.forEach(doc => {
        // Doc ID 就是日期字串 (例如 "2026-01-28")
        // 我們儲存 activities 陣列
        newMap[doc.id] = doc.data().activities || [];
      });
      setActivitiesMap(newMap);
    });
    return () => unsubscribe();
  }, []);

  // 取得當前選定日期的完整資料
  const currentDayConfig = TRIP_DATES[currentDayIndex];
  
  // 合併：如果 Firestore 有資料就用 Firestore 的，否則空陣列
  // 並根據時間排序
  const currentActivities = (activitiesMap[currentDayConfig.fullDate] || []).sort((a, b) => 
    a.time.localeCompare(b.time)
  );

  const currentDayFirestoreData = activitiesMap[currentDayConfig.fullDate];
  // 如果 Firestore 有存天氣就用 Firestore 的，否則用預設的
  const currentWeather = currentDayFirestoreData?.weather || currentDayConfig.defaultWeather; 
  // ----------------


  // 處理新增活動
  const handleSaveActivity = async (newActivity) => {
    if (!user) {
      alert("請先登入或等待連線...");
      return;
    }
    
    const dateDocId = currentDayConfig.fullDate;
    const docRef = doc(db, 'artifacts', appId, 'itineraries', dateDocId);

    try {
      // 使用 setDoc 與 merge: true，這樣如果當天文件不存在會自動建立
      await setDoc(docRef, {
        activities: arrayUnion(newActivity)
      }, { merge: true });
      
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error adding activity:", error);
      alert("儲存失敗，請檢查網路");
    }
  };

  // 處理刪除活動 (傳遞給 ActivityCard 的功能，您可以選擇性加入)
  const handleDeleteActivity = async (activityToDelete) => {
    if(!confirm("確定要刪除這個行程嗎？")) return;
    const dateDocId = currentDayConfig.fullDate;
    const docRef = doc(db, 'artifacts', appId, 'itineraries', dateDocId);
    try {
        await updateDoc(docRef, {
            activities: arrayRemove(activityToDelete)
        });
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans pb-24 sm:pb-0 sm:pl-20 text-stone-800">
      
      {/* Mobile Header (更新標題) */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-100 px-6 py-4 flex justify-between items-center sm:hidden">
        <h1 className="text-lg font-bold tracking-tight text-stone-800">SEOUL 2026</h1>
        <div className="text-xs text-stone-400 bg-stone-100 px-2 py-1 rounded">Ski Trip</div>
      </div>

      {/* Sidebar Navigation (保持不變) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-6 py-3 z-50 sm:top-0 sm:bottom-auto sm:right-auto sm:w-20 sm:h-screen sm:flex-col sm:border-t-0 sm:border-r sm:py-8 sm:px-0 flex justify-around items-center sm:justify-start sm:gap-8">
         {/* ... (原本的 Nav buttons) ... */}
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
            {/* Day Selector (更新邏輯) */}
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

            {/* Weather Widget (使用骨架中的預設天氣) */}
            <WeatherWidget weather={currentWeather} location={currentDayConfig.location} 
/>

            {/* Timeline Activities */}
            <div className="space-y-0 min-h-[200px]">
              {currentActivities.length === 0 ? (
                <div className="text-center py-10 text-stone-400 border-2 border-dashed border-stone-200 rounded-xl">
                  <p>這一天還沒有安排行程</p>
                  <p className="text-xs mt-1">點擊下方按鈕開始規劃</p>
                </div>
              ) : (
                currentActivities.map(activity => (
                  <div key={activity.id} className="relative group">
                     <ActivityCard activity={activity} />
                     {/* 刪除按鈕 (Hover 時顯示) */}
                     <button 
                        onClick={() => handleDeleteActivity(activity)}
                        className="absolute top-2 right-2 p-2 bg-white/90 rounded-full text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                     >
                        <Trash2 size={14} />
                     </button>
                  </div>
                ))
              )}
            </div>

            {/* Float Add Button (新增按鈕) */}
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="fixed bottom-20 right-6 sm:bottom-10 sm:right-10 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg shadow-blue-200 transition-transform active:scale-90 z-30 flex items-center gap-2"
            >
              <Plus size={24} />
              <span className="font-bold pr-1 sm:hidden">新增</span>
            </button>
          </div>
        )}

        {/* Tools Tab (保持不變) */}
        {activeTab === 'tools' && (
          <div className="space-y-8 fade-in">
             {/* ... (原本的 Tools 內容，注意 InfoCard 內的日期可以手動更新一下) ... */}
             <section>
              <h2 className="text-xl font-bold mb-4 px-1">旅程資訊</h2>
              <div className="grid gap-4">
                <InfoCard 
                  icon={Plane}
                  title="去程航班 LJ736"
                  content="2026/01/28 | RMQ 11:00 -> ICN 14:40"
                  subContent="航廈/經濟艙/行李 kg"
                  colorClass="bg-blue-500 text-blue-500"
                />
                <InfoCard
                  icon={Plane}
                  title="回程航班 LJ737"
                  content="2026/02/02 | ICN 15:20 -> RMQ 17:30"
                  subContent="航廈/經濟艙/行李 kg"
                  colorClass="bg-blue-500 text-blue-500"
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

      {/* Modal Render */}
      <AddActivityModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSave={handleSaveActivity}
        dateLabel={currentDayConfig.date}
      />

      {/* Global Styles for Scrollbar & Animation */}
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