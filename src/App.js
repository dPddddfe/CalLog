import React, { useState, useMemo, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import WeeklyCalendarPage from './pages/WeeklyCalendarPage';
import MonthlyCalendarPage from './pages/MonthlyCalendarPage';
import './App.css'; 

// Chart.js 모듈 등록
ChartJS.register(ArcElement, Tooltip, Legend);

// --- 인라인 SVG 아이콘 정의 ---
const IconWrapper = ({ children, className, ...props }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    {children}
  </svg>
);

const BarChart2 = (props) => (
  <IconWrapper {...props}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></IconWrapper>
);

const Calendar = (props) => (
  <IconWrapper {...props}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></IconWrapper>
);

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
  const data = {
    labels: ['당류', '탄수화물', '단백질'],
    datasets: [
      {
        data: [30, 30, 30], // 이미지에 표시된 30, 30, 30 비율에 맞춤
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
          label: function(context) {
            return `${context.label}: ${context.parsed}%`; 
          }
        }
      }
    }
  };

  return (
    <div className="chart-wrapper">
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
  const [newMeal, setNewMeal] = useState({ name: '', calories: '', carbs: '', sugar: '' });
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
        },
      ]);
      setNewMeal({ name: '', calories: '', carbs: '', sugar: '' });
    }
  };



  return (
    <div className="today-diet-layout">
      {/* 좌측 패널 - 모든 콘텐츠 포함 */}
      <div className="left-panel">
        {/* 상단: 요약 카드들 */}
        <div className="summary-section">
          {/* 왼쪽: 오늘 칼로리 요약 */}
          <div className="section-header">오늘 총 섭취 칼로리</div>
          <div className="summary-card">
            <div className="summary-value">{totalCalories} kcal</div>
  
            <div className="summary-sub">목표 {goalCalories} kcal 기준</div>
  
            <div className="summary-goal-row">
              <input
                type="number"
                value={goalCalories}
                onChange={(e) => handleGoalCaloriesChange(e.target.value)} // 수정!
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
  
          {/* 오른쪽: 개인 맞춤 목표 설정 */}
          <div className="summary-section"></div>
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
            탄수화물-{meal.carbs} 당류-{meal.sugar}
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
            placeholder="이름"
            value={newMeal.name}
            onChange={handleInputChange}
            className="add-input"
          />
          <input
            type="number"
            name="calories"
            placeholder="kal"
            value={newMeal.calories}
            onChange={handleInputChange}
            className="add-input small-input"
          />
          <input
            type="number"
            name="carbs"
            placeholder="탄수화물-"
            value={newMeal.carbs}
            onChange={handleInputChange}
            className="add-input"
          />
          <input
            type="number"
            name="sugar"
            placeholder="당류-"
            value={newMeal.sugar}
            onChange={handleInputChange}
            className="add-input"
          />
          <button onClick={handleAddMeal} className="add-button">
            추가
          </button>
        </div>
      </div>
  
      {/* 우측: 도넛 차트 */}
      <div className="right-panel">
        <MacroDoughnutChart meals={meals} />
      </div>
    </div>
  );
};


// --- 3. 기타 페이지 컴포넌트 (Placeholder) ---

const CaloriePage = () => (
  <div className="placeholder-page-wrapper">
    <div className="placeholder-page-box sky-theme">
      <h2 className="placeholder-title">
        <BarChart2 className="placeholder-icon" /> 칼로리 관리 (Calorie Management)
      </h2>
      <p className="placeholder-text">
        이 페이지에서는 주간/월간 칼로리 섭취 패턴을 시각적으로 보여주는 차트와 상세 분석 리포트가 표시될 예정입니다.
      </p>
      <div className="placeholder-visual">
        <p>[데이터 시각화 그래프 Placeholder]</p>
      </div>
    </div>
  </div>
);
/*
const WeeklyCalendarPage = () => (
  <div className="placeholder-page-wrapper">
    <div className="placeholder-page-box lime-theme">
      <h2 className="placeholder-title">
        <Calendar className="placeholder-icon" /> 주별 달력 (Weekly Calendar)
      </h2>
      <p className="placeholder-text">
        이 페이지는 달력 형태로 주간 목표 달성률, 주요 기록 등을 확인할 수 있는 아카이브 역할을 할 것입니다.
      </p>
      <div className="placeholder-visual">
        <p>[주별 달력 및 기록 Placeholder]</p>
      </div>
    </div>
  </div>
);

const MonthlyCalendarPage = () => (
  <div className="placeholder-page-wrapper">
    <div className="placeholder-page-box lime-theme">
      <h2 className="placeholder-title">
        <Calendar className="placeholder-icon" /> 월별 달력 (Monthly Calendar)
      </h2>
      <p className="placeholder-text">
        이 페이지는 달력 형태로 월별 목표 달성률, 주요 기록 등을 확인할 수 있는 아카이브 역할을 할 것입니다.
      </p>
      <div className="placeholder-visual">
        <p>[월별 달력 및 기록 Placeholder]</p>
      </div>
    </div>
  </div>
); */


// --- 4. 메인 애플리케이션 컴포넌트 ---
const App = () => {
  const [currentPage, setCurrentPage] = useState('today'); 

  const renderPage = () => {
    switch (currentPage) {
      case 'today':
        return <TodayDietPage />;
      case 'calorie':
        return <CaloriePage />;
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
        max-width: 1200px;
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
        max-width: 1200px;
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
        flex: 2; 
        min-width: 300px; 
    }

    .right-panel {
        flex: 1; 
        min-width: 250px; 
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: var(--color-item-bg); 
        border-radius: 20px;
        box-shadow: 0 5px 15px var(--color-shadow-light);
        padding: 20px;
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
        background-color: var(--color-item-bg); 
        padding: 15px 20px;
        border-radius: 15px; 
        box-shadow: 0 2px 8px var(--color-shadow-light);
        display: flex;
        align-items: center;
        font-size: 1.1rem;
    }

    .meal-name {
        font-weight: bold;
        min-width: 80px; 
    }

    .meal-calories {
        min-width: 80px; 
        color: var(--color-text-light);
        font-weight: 500;
    }

    .meal-macros {
        color: var(--color-text-light);
        font-size: 0.95rem;
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
        max-width: 350px; 
        padding: 20px;
    }

    .chart-container {
        position: relative;
        width: 100%;
        height: 300px; 
    }

    /* 차트 범례 */
    .chart-legend {
        display: flex;
        gap: 1rem;
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
        padding: 0 1rem;
    }

    .placeholder-page-box {
        padding: 40px;
        border-radius: 24px;
        box-shadow: 0 10px 20px var(--color-shadow-light);
        text-align: center;
    }

    .sky-theme {
        background-color: #E3F2FD; 
        border: 1px solid #90CAF9;
    }

    .lime-theme {
        background-color: #F1F8E9; 
        border: 1px solid #C5E1A5;
    }

    .placeholder-title {
        font-size: 2rem;
        font-weight: 800;
        color: #1565C0;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .lime-theme .placeholder-title {
        color: #558B2F;
    }

    .placeholder-icon {
        width: 32px;
        height: 32px;
        margin-right: 8px;
        stroke: currentColor; 
    }

    .placeholder-text {
        color: #666;
        font-size: 1.125rem;
        margin-bottom: 1.5rem;
    }

    .placeholder-visual {
        background-color: white;
        padding: 1rem;
        border-radius: 12px;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
        border: 1px solid #f0f0f0;
        color: #aaa;
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
            flex-direction: column;
            align-items: center;
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