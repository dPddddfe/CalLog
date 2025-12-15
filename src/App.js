import React, { useState, useMemo, useRef, useEffect } from 'react'; 
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import WeeklyCalendarPage from './pages/WeeklyCalendarPage';
import MonthlyCalendarPage from './pages/MonthlyCalendarPage';
import CalorieManagementPage from './pages/CalorieManagement'; 

import './App.css'; 
import { fetchNutritionFromEdamam } from './api/edamam';

console.log("EDAMAM ID:", process.env.REACT_APP_EDAMAM_ID);
console.log("EDAMAM KEY:", process.env.REACT_APP_EDAMAM_KEY);
// Chart.js 모듈 등록
ChartJS.register(ArcElement, Tooltip, Legend);

// --- 인라인 SVG 아이콘 정의 ---
const IconWrapper = ({ children, className, ...props }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    {children}
  </svg>
);

// const BarChart2 = (props) => (
//   <IconWrapper {...props}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></IconWrapper>
// );

// const Calendar = (props) => (
//   <IconWrapper {...props}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></IconWrapper>
// );

// --- 기본 데이터 구조 ---
const initialMeals = [
  { id: 1, name: '사과', calories: 60, carbs: 30, sugar: 2 },
  { id: 2, name: '고구마', calories: 60, carbs: 30, sugar: 2 },
  { id: 3, name: '상추', calories: 60, carbs: 30, sugar: 2 },
];

// --- 1. 헤더 및 네비게이션 컴포넌트 ---
const Header = ({ currentPage, setCurrentPage }) => {
  const navItems = [
    { key: 'today', label: '오늘의 식단' },
    { key: 'calorie', label: '칼로리 관리' },
    { key: 'weekly', label: '주간 달력' },
    { key: 'monthly', label: '월간 달력' },
  ];

  return (
    <header className="header-bar">
      <div className="header-content-wrapper">
        {/* 로고 영역 */}
        <div className="app-logo">CALLOG</div>

        {/* 상단바 */}
        <nav className="nav-menu">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setCurrentPage(item.key)}
              className={`nav-button ${currentPage === item.key ? 'active' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

// --- 도넛 차트 컴포넌트 ---
const MacroDoughnutChart = ({ meals }) => {
  // 1) 안전하게 기본값 처리
  const safeMeals = Array.isArray(meals) ? meals : [];

  // 2) 각 영양소 합계 계산 (현재는 carbs, sugar만 있으니까 단백질은 0으로)
  const totalSugar = safeMeals.reduce((sum, meal) => sum + (meal.sugar || 0), 0);
  const totalCarbs = safeMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
  const totalProtein = safeMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0); // 나중에 protein 필드 추가할 때 사용

  // 3) 비율 계산을 위해 총합 구하기
  const total = totalSugar + totalCarbs + totalProtein;

  // 4) 차트에 넣을 데이터 (총합이 0이면 0,0,0)
  const chartValues =
    total > 0
      ? [
          Math.round((totalSugar / total) * 100),
          Math.round((totalCarbs / total) * 100),
          Math.round((totalProtein / total) * 100),
        ]
      : [0, 0, 0];

  const data = {
    labels: ['당류', '탄수화물', '단백질'],
    datasets: [
      {
        data: chartValues, 
        backgroundColor: [
          '#66BB6A', // 연두색 계열 (당류)
          '#4DB6AC', // 청록색 계열 (탄수화물)
          '#4DD0E1', // 하늘색 계열 (단백질)
        ],
        borderColor: ['#5CB85C', '#4CAFB9', '#4BD0E9'],
        borderWidth: 1,
        cutout: '60%',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.label}: ${context.parsed}%`;
          }
        }
      }
    }
  };

  return (
    <div className="chart-wrapper">
      <div className="section-header">매크로 영양소 비율</div> {/* 헤더 추가 */}
      <div className="chart-container">
        <Doughnut data={data} options={options} />
      </div>
      {/* 커스텀 범례 */}
      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-color-box green"></span> 당류
        </div>
        <div className="legend-item">
          <span className="legend-color-box cyan"></span> 탄수화물
        </div>
        <div className="legend-item">
          <span className="legend-color-box blue"></span> 단백질
        </div>
      </div>
    </div>
  );
};


// --- 메인 페이지 컴포넌트 ---
const TodayDietPage = () => {
  // --- 타이머 기능 상태 및 로직 시작 ---
  const [isFasting, setIsFasting] = useState(false);
  const [fastStartTime, setFastStartTime] = useState(null);
  const [fastElapsed, setFastElapsed] = useState(0);

  // 저장된 단식 기록 불러오기 
  useEffect(() => {
    const saved = localStorage.getItem("fastRecord");
    if (saved) setFastElapsed(Number(saved));
    const savedRunning = localStorage.getItem("fastRunning");
    const savedStart = localStorage.getItem("fastStartTime");
    if (savedRunning === 'true' && savedStart) {
      setFastStartTime(Number(savedStart));
      setIsFasting(true);
    }
  }, []);

  // 실시간 타이머 작동
  useEffect(() => {
    let interval = null;
    if (isFasting) {
      interval = setInterval(() => {
        // fastStartTime이 설정되지 않았다면 현재 시간 사용
        setFastElapsed(Date.now() - (fastStartTime || Date.now()));
      }, 1000);
      localStorage.setItem("fastRunning", 'true');
      if (fastStartTime) localStorage.setItem("fastStartTime", String(fastStartTime));
    } else {
      localStorage.setItem("fastRunning", 'false');
    }
    return () => clearInterval(interval);
  }, [isFasting, fastStartTime]);

  // 타이머 시작
  const startFasting = () => {
    const now = Date.now();
    setFastStartTime(now);
    setIsFasting(true);
    localStorage.setItem("fastStartTime", String(now));
    localStorage.setItem("fastRunning", 'true');
  };

  // 타이머 종료
  const stopFasting = () => {
    setIsFasting(false);
    localStorage.setItem("fastRecord", String(fastElapsed));
    localStorage.setItem("fastRunning", 'false');
  };

  // 포맷 헬퍼: ms -> HH:MM:SS
  const formatElapsed = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
    const s = String(totalSec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };
  // --- 타이머 기능 상태 및 로직 끝 ---


  // 수정 기능을 위한 상태
const [editingId, setEditingId] = useState(null);
const [editMeal, setEditMeal] = useState({ name: '', calories: '', carbs: '', sugar: '' });

// 삭제 처리
const handleDelete = (id) => {
  setMeals(meals.filter((meal) => meal.id !== id));
};

// 수정 시작: 기존 값 입력창에 로드
const handleEditStart = (meal) => {
  setEditingId(meal.id);
  setEditMeal({ ...meal });
};

// 수정 입력 처리
const handleEditChange = (e) => {
  const { name, value } = e.target;
  setEditMeal((prev) => ({ ...prev, [name]: value }));
};

// 수정 저장
const handleEditSave = () => {
  setMeals((prev) =>
    prev.map((meal) =>
      meal.id === editingId
        ? {
            ...editMeal,
            calories: Number(editMeal.calories),
            carbs: Number(editMeal.carbs),
            sugar: Number(editMeal.sugar),
          }
        : meal
    )
  );
  setEditingId(null);
};

  const [meals, setMeals] = useState(initialMeals);
  const [newMeal, setNewMeal] = useState({ name: '', calories: '', carbs: '', sugar: '', protein: '' });
  // 🔹 Edamam API 호출 중인지 표시하는 플래그
  const [isFetchingNutrition, setIsFetchingNutrition] = useState(false);
  const nextId = useRef(initialMeals.length + 1);
  const [goalCalories, setGoalCalories] = useState(() => {
    const saved = localStorage.getItem('goalCalories');
    return saved ? Number(saved) : 1800; // 저장된 값 또는 기본값 1800
  });

  


  // 키/몸무게/활동량 상태
  const [height, setHeight] = useState('');        // cm
  const [weight, setWeight] = useState('');        // kg
  const [targetWeight, setTargetWeight] = useState(''); // kg
  const [age, setAge] = useState('');              // 나이 - 새로 추가
  const [gender, setGender] = useState('female');    // 성별 - 새로 추가 (기본값: 여성)
  const [activity, setActivity] = useState('medium');   // low / medium / high

  // 총 칼로리 계산
  const totalCalories = useMemo(() => {
    return meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
  }, [meals]);

  const remainingCalories = goalCalories - totalCalories;

  // 목표 칼로리가 바뀔 때마다 localStorage에 저장
  const handleGoalCaloriesChange = (value) => {
    const newGoal = Number(value) || 0;
    setGoalCalories(newGoal);
    localStorage.setItem('goalCalories', newGoal); // 저장!
  };

  //  목표 칼로리 추천 함수 (Mifflin-St Jeor 공식 사용)
  const handleRecommendGoal = () => {
    // 1단계: 입력값 가져오기
    const w = Number(weight);    // 몸무게
    const h = Number(height);    // 키
    const a = Number(age);       // 나이
    
    // 입력값 확인 - 하나라도 없으면 계산 안 함
    if (!w || !h || !a) {
      alert('키, 몸무게, 나이를 모두 입력해주세요!');
      return;
    }

    // 2단계: BMR 계산 (기초대사량 = 가만히 있어도 소모되는 칼로리)
    // Mifflin-St Jeor 공식
    let bmr = (10 * w) + (6.25 * h) - (5 * a);
    
    // 성별에 따라 마지막 숫자 더하거나 빼기
    if (gender === 'male') {
      bmr += 5;      // 남성: +5
    } else {
      bmr -= 161;    // 여성: -161
    }

    // 3단계: 활동량 곱하기 (실제로 필요한 칼로리)
    let activityFactor;
    if (activity === 'low') activityFactor = 1.2;        // 거의 운동 안 함
    else if (activity === 'high') activityFactor = 1.725; // 많이 활동함
    else activityFactor = 1.55;                          // 보통

    let recommended = bmr * activityFactor;

    // 4단계: 목표 몸무게에 따라 조정
    const tw = Number(targetWeight);
    if (tw) {
      const diff = w - tw;  // 현재 - 목표
      if (diff > 0) {
        // 살을 빼고 싶으면: -500 kcal
        recommended -= 500;
      } else if (diff < 0) {
        // 살을 찌우고 싶으면: +500 kcal
        recommended += 500;
      }
    }

    // 5단계: 소수점 제거하고 설정
    recommended = Math.round(recommended);
    setGoalCalories(recommended);
    localStorage.setItem('goalCalories', recommended); // 저장!
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMeal((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddMeal = () => {
    if (newMeal.name && newMeal.calories) {
      setMeals((prev) => [
        ...prev,
        {
          id: nextId.current++,
          name: newMeal.name,
          calories: parseInt(newMeal.calories),
          carbs: parseInt(newMeal.carbs || 0),
          sugar: parseInt(newMeal.sugar || 0),
          protein: parseInt(newMeal.protein || 0),
        },
      ]);
      setNewMeal({ name: '', calories: '', carbs: '', sugar: '' });
    }
  };

    // Edamam에서 영양 정보 가져오기
    const handleFetchNutrition = async () => {
      if (!newMeal.name || !newMeal.name.trim()) {
        alert('먼저 음식 이름을 입력해 주세요!\n예: "1 apple", "100g chicken"');
        return;
      }
  
      try {
        setIsFetchingNutrition(true);
  
        // newMeal.name → Edamam API로 요청
        const result = await fetchNutritionFromEdamam(newMeal.name);
        console.log("[App] Edamam result:", result);
        // result = { calories, carbs, sugar, protein }
  
        // newMeal 상태에 응답 값 채워넣기
        setNewMeal((prev) => ({
          ...prev,
          calories: result.calories,
          carbs: result.carbs,
          sugar: result.sugar,
          protein: result.protein,
        }));
      } catch (error) {
        console.error(error);
        alert('영양 정보를 가져오지 못했어요. 이름/단위 표현을 한 번만 더 확인해 주세요.');
      } finally {
        setIsFetchingNutrition(false);
      }
    };
  

  return (
    <div className="today-diet-layout">
      {/* 좌측 패널 - 모든 콘텐츠 포함 */}
      <div className="left-panel">
        {/* 상단: 요약 카드들 */}
        <div className="summary-section-wrapper-vertical"> 

          {/* 1. 오늘 총 섭취 칼로리 (위) */}
          <div className="summary-section-full-width">
            <div className="section-header">오늘 총 섭취 칼로리</div>
            <div className="summary-card">
              <div className="summary-value">{totalCalories} kcal</div>
    
              <div className="summary-sub">목표 {goalCalories} kcal 기준</div>
    
              <div className="summary-goal-row">
                <input
                  type="number"
                  value={goalCalories}
                  onChange={(e) => handleGoalCaloriesChange(e.target.value)}
                  className="goal-input"
                />
                <span className="summary-goal-unit">kcal</span>
              </div>
    
              <div className="summary-sub">
                {remainingCalories >= 0
                  ? `남은 칼로리: ${remainingCalories} kcal`
                  : `초과 칼로리: ${Math.abs(remainingCalories)} kcal`}
              </div>
            </div>
          </div>
  
          {/* 2. 개인 맞춤 목표 설정 (아래로 이동) */}
          <div className="summary-section-full-width">
              <div className="section-header">개인 맞춤 목표 설정</div>
              <div className="summary-right">
  
                {/* 성별 선택 */}
                <div className="summary-right-row">
                  <label>
                    성별
                    <select
                      className="summary-select"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option value="male">남성</option>
                      <option value="female">여성</option>
                    </select>
                  </label>
                </div>
  
                {/* 나이 입력 */}
                <div className="summary-right-row">
                  <label>
                    나이
                    <input
                      type="number"
                      className="summary-input"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="세"
                    />
                    <span className="summary-input-unit">세</span>
                  </label>
                </div>
  
                <div className="summary-right-row">
                  <label>
                    키
                    <input
                      type="number"
                      className="summary-input"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="cm"
                    />
                    <span className="summary-input-unit">cm</span>
                  </label>
                </div>
      
                <div className="summary-right-row">
                  <label>
                    현재 몸무게
                    <input
                      type="number"
                      className="summary-input"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="kg"
                    />
                    <span className="summary-input-unit">kg</span>
                  </label>
                </div>
      
                <div className="summary-right-row">
                  <label>
                    목표 몸무게
                    <input
                      type="number"
                      className="summary-input"
                      value={targetWeight}
                      onChange={(e) => setTargetWeight(e.target.value)}
                      placeholder="kg"
                    />
                    <span className="summary-input-unit">kg</span>
                  </label>
                </div>
      
                <div className="summary-right-row">
                  <label>
                    활동량
                    <select
                      className="summary-select"
                      value={activity}
                      onChange={(e) => setActivity(e.target.value)}
                    >
                      <option value="low">낮음 (운동 거의 안 함)</option>
                      <option value="medium">보통 (주 1~3회 가벼운 운동)</option>
                      <option value="high">높음 (주 3회 이상 활동적)</option>
                    </select>
                  </label>
                </div>
      
                <button
                  type="button"
                  className="summary-button"
                  onClick={handleRecommendGoal}
                >
                  목표 칼로리 제안하기
                </button>
              </div>
            </div>
        </div>

  
        {/* 목록 */}
        <div className="section-header">목록</div>
        <div className="meal-list-section">
  {meals.map((meal) => (
    <div key={meal.id} className="meal-item-card">
      {editingId === meal.id ? (
        <>
          <input
            type="text"
            name="name"
            value={editMeal.name}
            onChange={handleEditChange}
            className="add-input"
          />
          <input
            type="number"
            name="calories"
            value={editMeal.calories}
            onChange={handleEditChange}
            className="add-input small-input"
          />
          <input
            type="number"
            name="carbs"
            value={editMeal.carbs}
            onChange={handleEditChange}
            className="add-input"
          />
          <input
            type="number"
            name="sugar"
            value={editMeal.sugar}
            onChange={handleEditChange}
            className="add-input"
          />

          <button onClick={handleEditSave} className="add-button">
            저장
          </button>
          <button onClick={() => setEditingId(null)} className="add-button delete">
            취소
          </button>
        </>
      ) : (
        <>
          <span className="meal-name">{meal.name}</span>
          <span className="meal-calories">{meal.calories} kcal</span>
          <span className="meal-macros">
            탄수화물-{meal.carbs} 단백질-{meal.protein} 당류-{meal.sugar}
          </span>

          <button className="add-button" onClick={() => handleEditStart(meal)}>
            수정
          </button>
          <button className="add-button delete" onClick={() => handleDelete(meal.id)}>
            삭제
          </button>
        </>
      )}
    </div>
  ))}
</div>

  
        {/* 음식 추가 */}
        <div className="section-header add-food-header">음식 추가</div>
        <div className="add-meal-section">
          <input
            type="text"
            name="name"
            placeholder='먹은 음식과 양을 적어주세요 (예: "1 apple", "100g chicken breast")'
            value={newMeal.name}
            onChange={handleInputChange}
            className="add-input"
          />
          <p style={{ fontSize: '0.85rem', color: '#777', marginTop: '4px' }}>
            영양 정보는 Edamam API를 사용해 계산돼요. 수량 + 단위 + 음식명 조합의 
            영어로 입력해 주세요. (예: 1 apple, 100g chicken breast)
          </p>
          <input
            type="number"
            name="calories"
            placeholder="kcal"
            value={newMeal.calories}
            readOnly
            className="add-input small-input"
          />
          <input
            type="number"
            name="carbs"
            placeholder="탄수화물(g)"
            value={newMeal.carbs}
            readOnly
            className="add-input"
          />
          <input
            type="number"
            name="protein"
            placeholder="단백질(g)"
            value={newMeal.protein}
            readOnly
            className="add-input"
          />
          <input
            type="number"
            name="sugar"
            placeholder="당류(g)"
            value={newMeal.sugar}
            readOnly
            className="add-input"
          />
          {/* 🔹 Edamam API 호출 버튼 */}
          <button
            type="button"
            onClick={handleFetchNutrition}
            className="add-button"
            disabled={isFetchingNutrition}
          >
            {isFetchingNutrition ? '불러오는 중...' : '영양 정보 가져오기'}
          </button>

          <button onClick={handleAddMeal} className="add-button">
            추가
          </button>
        </div>
      </div>
  
      {/* 우측 패널 */}
      <div className="right-panel">
        <div className="right-panel-content">
          {/* 1. 단식 타이머: 그래프 위에 보이도록 우측 패널 상단에 배치 */}
          <div className="summary-section" style={{ width: '100%', marginBottom: '12px' }}>
            <div className="section-header">단식 타이머</div>

            <div className="summary-card fasting-timer-card">
              <div className="summary-value" style={{ fontSize: '1.4rem' }}>
                {formatElapsed(fastElapsed)}
              </div>
              <div className="summary-sub">
                오늘 단식 진행 시간
              </div>

              {!isFasting ? (
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button className="summary-button" onClick={startFasting}>
                    단식 시작
                  </button>
                  {/* 재시작: 로컬에 저장된 값을 초기화하고 다시 시작하고 싶을 때 사용 */}
                  <button className="summary-button delete" onClick={() => {
                    setFastElapsed(0);
                    setFastStartTime(null);
                    localStorage.removeItem("fastRecord");
                    localStorage.removeItem("fastStartTime");
                  }}>
                    기록 초기화
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button className="summary-button delete" onClick={stopFasting}>
                    단식 종료
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 2. 매크로 영양소 차트 */}
          <MacroDoughnutChart meals={meals} />
        </div>
      </div>
    </div>
  );
};



// --- 4. 메인 애플리케이션 컴포넌트 ---
const App = () => {
  const [currentPage, setCurrentPage] = useState('today'); 

  const renderPage = () => {
    switch (currentPage) {
      case 'today':
        return <TodayDietPage />;
      case 'calorie':
        return <CalorieManagementPage />;
      case 'weekly':
        return <WeeklyCalendarPage />;
      case 'monthly':
        return <MonthlyCalendarPage />;
      default:
        return <TodayDietPage />;
    }
  };

  // 모든 CSS 스타일을 <style> 태그 내에 삽입
  const styles = `
  *, *::before, *::after {
    box-sizing: border-box;
  }
    /* 기본 CSS 리셋 */
    body {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Arial', sans-serif; 
    }

    #root {
        min-height: 100vh;
    }

    /* ** 전역 스타일 및 연노랑 배경 ** */
    :root {
        --color-light-yellow: #FFF8E1; /* 연노랑 배경 */
        --color-dark-green: #6C8D50; /* 상단바 배경색 */
        --color-light-green: #A2CF8A; /* 상단바 활성화/로고 색 */
        --color-white: #FFFFFF;
        --color-text-dark: #333333;
        --color-text-light: #555555;
        --color-border-light: #E0E0E0;
        --color-shadow-light: rgba(0, 0, 0, 0.1);

        /* 이미지의 박스 색상 */
        --color-item-bg: #F8F8F8; /* 목록 아이템 배경 */
        --color-header-bg: #D4EDDA; /* 목록/음식추가 헤더 배경 */

        /* 차트 색상 (이미지 기반) */
        --chart-green-1: #66BB6A; /* 당류 */
        --chart-green-2: #4DB6AC; /* 탄수화물 */
        --chart-green-3: #4DD0E1; /* 단백질 */
    }

    .app-container {
        min-height: 100vh;
        background-color: var(--color-light-yellow);
        font-family: 'Noto Sans KR', sans-serif;
        color: var(--color-text-dark);
    }

    .main-content {
        max-width: 1000px; /* **1. 최대 너비 1200px에서 1000px로 조정** */
        margin: 0 auto;
        padding: 1rem;
    }

    /* ** 1. 헤더 및 네비게이션 ** */

    .header-bar {
        background-color: var(--color-dark-green);
        position: sticky;
        top: 0;
        z-index: 10;
        box-shadow: 0 2px 4px var(--color-shadow-light);
        padding: 0.5rem 0; 
    }

    .header-content-wrapper {
        max-width: 1000px; /* **1. 헤더 콘텐츠 너비도 조정** */
        margin: 0 auto;
        padding: 0 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .app-logo {
        font-family: 'Impact', sans-serif; 
        font-size: 2.2rem;
        font-weight: bold;
        color: var(--color-light-green); 
        letter-spacing: 0.1em;
        padding-left: 10px;
        text-shadow: 2px 2px 0px rgba(0,0,0,0.2); 
    }

    .nav-menu {
        display: flex;
        gap: 1.5rem; 
    }

    .nav-button {
        font-size: 1.1rem;
        font-weight: 600;
        transition: all 0.2s;
        padding: 10px 15px;
        border-radius: 8px; 
        color: var(--color-white); 
        background: transparent;
        border: none;
        cursor: pointer;
        font-family: 'Noto Sans KR', sans-serif;
    }

    .nav-button:hover {
        background-color: rgba(255, 255, 255, 0.1);
    }

    .nav-button.active {
        color: var(--color-text-dark); 
        background-color: var(--color-light-green); 
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    }

    /* ** 메인 콘텐츠 - 오늘의 식단 페이지 ** */
    .today-diet-layout {
        display: flex;
        flex-wrap: wrap; 
        gap: 2rem;
        padding: 2rem 0;
    }

    .left-panel {
      flex: 2 1 0;   /* ⭐ 핵심 */
      min-width: 300px;
      max-width: 650px;
    }
    .right-panel {
        flex: 1; 
        min-width: 250px; 
        display: flex;
        flex-direction: column; 
        justify-content: flex-start;
        align-items: center;
        background-color: var(--color-item-bg); 
        border-radius: 20px;
        box-shadow: 0 5px 15px var(--color-shadow-light);
        padding: 20px;
    }

    .right-panel-content {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .summary-section-wrapper-vertical { 
      display: flex;
      flex-direction: column; 
      gap: 20px;
      width: 100%;
    }

    .summary-section-full-width { 
      flex: none; 
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    
    .summary-section {
      flex: 1;
      min-width: 48%;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .summary-card {
        background-color: var(--color-white);
        padding: 20px;
        border-radius: 15px;
        box-shadow: 0 2px 8px var(--color-shadow-light);
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .fasting-timer-card {
      text-align: center;
      align-items: center;
      padding: 15px;
    }

    .summary-value {
        font-size: 1.8rem;
        font-weight: bold;
        color: var(--color-dark-green);
    }

    .summary-sub {
        font-size: 0.9rem;
        color: var(--color-text-light);
    }

    .summary-goal-row {
        display: flex;
        align-items: center;
        gap: 5px;
    }
    
    .goal-input {
      width: 80px;
      padding: 5px;
      border: 1px solid var(--color-border-light);
      border-radius: 8px;
      text-align: right;
      font-size: 1rem;
    }

    .summary-goal-unit {
        font-weight: bold;
    }

    .summary-right {
        background-color: var(--color-white);
        padding: 20px;
        border-radius: 15px;
        box-shadow: 0 2px 8px var(--color-shadow-light);
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .summary-right-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 1rem;
    }

    .summary-right-row label {
      display: flex;
      flex-wrap: wrap;          /* ⭐ 핵심 */
      align-items: center;
      width: 100%;
      gap: 8px;                 /* ⭐ 공간 확보 */
    }

    .summary-input {
      width: 80px;
      padding: 5px;
      border: 1px solid var(--color-border-light);
      border-radius: 8px;
      text-align: right;
      font-size: 1rem;
      margin-left: 10px;
    }
    
    .summary-select {
        padding: 5px;
        border: 1px solid var(--color-border-light);
        border-radius: 8px;
        font-size: 1rem;
        margin-left: 10px;
        max-width: 150px;
    }
    
    .summary-input-unit {
        margin-left: 5px;
        font-size: 0.9rem;
        color: var(--color-text-light);
        white-space: nowrap;
    }

    .summary-button {
      background-color: var(--color-light-green);
      color: var(--color-text-dark);
      font-weight: bold;
      padding: 10px 15px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      transition: background-color 0.2s, transform 0.1s;
      font-size: 1rem;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      width: 100%;
      margin-top: 10px;
    }

    .summary-button.delete {
      background-color: #F44336; /* 붉은색 */
      color: var(--color-white);
    }

    /* 섹션 헤더 (목록, 음식 추가) */
    .section-header {
        background-color: var(--color-header-bg); 
        color: var(--color-text-dark);
        font-size: 1.2rem;
        font-weight: bold;
        padding: 10px 15px;
        border-radius: 15px; 
        margin-bottom: 1.5rem;
        width: fit-content; 
        box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    }

    .add-food-header {
        margin-top: 2rem;
    }

    /* 음식 목록 섹션 */
    .meal-list-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .meal-item-card {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    
    .meal-name {
      font-weight: bold;
      flex-grow: 1;
    }
    
    /* ⭐ 추가 */
    .meal-item-card button {
      flex-shrink: 0;
    }
    
    .meal-macros {
      flex-shrink: 0;
    } 

    /* 음식 추가 섹션 */
    .add-meal-section {
        background-color: var(--color-item-bg);
        padding: 20px;
        border-radius: 15px;
        box-shadow: 0 5px 15px var(--color-shadow-light);
        display: flex;
        flex-wrap: wrap; 
        gap: 15px;
        align-items: center;
    }

    .add-input {
        flex: 1; 
        min-width: 100px; 
        padding: 12px 15px;
        border: 1px solid var(--color-border-light);
        border-radius: 10px;
        font-size: 1rem;
        transition: border-color 0.2s, box-shadow 0.2s;
        outline: none;
    }

    .add-input:focus {
        border-color: var(--color-light-green);
        box-shadow: 0 0 0 3px rgba(162, 207, 138, 0.3);
    }

    .add-input.small-input {
        flex: none; 
        width: 80px; 
    }

    .add-button {
        background-color: var(--color-light-green);
        color: var(--color-text-dark);
        font-weight: bold;
        padding: 12px 20px;
        border-radius: 10px;
        border: none;
        cursor: pointer;
        transition: background-color 0.2s, transform 0.1s;
        font-size: 1rem;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    .add-button.delete {
        background-color: #F44336; /* 붉은색 */
        color: var(--color-white);
    }

    .add-button:hover {
        background-color: #8CCF6F;
        transform: translateY(-1px);
    }


    /* ** 도넛 차트 ** */
    .chart-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        width: 100%;
        max-width: 400px; /* 차트의 최대 크기 조정 */
        padding: 20px 0 0 0;
    }

    .chart-container {
        position: relative;
        width: 100%;
        height: 300px; 
    }

    /* 차트 범례 */
    .chart-legend {
        display: flex;
        gap: 1.5rem;
        margin-top: 1rem;
        font-size: 0.95rem;
        flex-wrap: wrap; 
        justify-content: center;
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: 5px;
        color: var(--color-text-dark);
    }

    .legend-color-box {
        width: 15px;
        height: 15px;
        border-radius: 3px;
        border: 1px solid rgba(0,0,0,0.1);
    }

    /* 범례 색상 */
    .legend-color-box.green { background-color: var(--chart-green-1); }
    .legend-color-box.cyan { background-color: var(--chart-green-2); }
    .legend-color-box.blue { background-color: var(--chart-green-3); }


    /* ** Placeholder 페이지 스타일 ** */
    .placeholder-page-wrapper {
        max-width: 900px;
        margin: 2rem auto;
        padding: 3rem; /* 여백 추가 */
        font-size: 1.5rem; /* 글자 크기 키움 */
        text-align: center;
        border: 2px dashed var(--color-light-green); /* 테두리 추가 */
        border-radius: 15px;
        background-color: var(--color-white);
        min-height: 400px;
        display: flex;
        justify-content: center;
        align-items: center;
        color: var(--color-dark-green);
        font-weight: bold;
    }

    /* ** 반응형 조정 ** */
    @media (max-width: 768px) {
        .header-content-wrapper {
            flex-direction: column;
            gap: 1rem;
        }

        .nav-menu {
            flex-wrap: wrap;
            justify-content: center;
            gap: 0.5rem;
        }

        .nav-button {
            font-size: 0.9rem;
            padding: 8px 10px;
        }

        .today-diet-layout {
          display: flex;
          flex-wrap: wrap;
          gap: 2rem;
          align-items: flex-start;   /* ⭐ 추가 */
        }

        .left-panel, .right-panel {
            width: 100%;
            max-width: 500px; 
        }

        .meal-item-card {
            flex-wrap: wrap;
            justify-content: space-between;
            font-size: 1rem;
        }

        .meal-calories, .meal-macros {
            flex-basis: 48%; 
            text-align: right;
        }

        .meal-name {
          flex-basis: 100%; 
          margin-bottom: 5px;
        }

        .add-meal-section {
            flex-direction: column;
        }

        .add-input, .add-input.small-input {
            width: 100%;
            min-width: unset;
        }
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="app-container">
        <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
        
        <main className="main-content">
          {renderPage()}
        </main>
      </div>
    </>
  );
};

export default App;