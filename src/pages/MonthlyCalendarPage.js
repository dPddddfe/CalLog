import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  getDay,
  parseISO
} from 'date-fns';
import { ko } from 'date-fns/locale';

// Chart.js 모듈 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const MonthlyCalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [mealsData, setMealsData] = useState([]); // 🔹 API 데이터
  const [loading, setLoading] = useState(true); // 🔹 로딩 상태
  
  // 매번 localStorage에서 최신 값 읽기
  const goalCalories = (() => {
    const saved = localStorage.getItem('goalCalories');
    return saved ? Number(saved) : 2000;
  })();

  // 🔹 Mock API에서 데이터 가져오기
  useEffect(() => {
    const fetchMeals = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://693f646312c964ee6b6fcad6.mockapi.io/meals');
        const data = await response.json();
        console.log('Fetched meals:', data);
        setMealsData(data);
      } catch (error) {
        console.error('데이터 가져오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMeals();
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDates = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const monthTitle = format(currentDate, 'yyyy년 M월', { locale: ko });

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  // 🔹 실제 데이터 처리 (날짜별로 그룹화)
  const monthData = monthDates.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // 해당 날짜의 모든 식사 필터링
    const dayMeals = mealsData.filter(meal => {
      const mealDate = meal.date ? format(parseISO(meal.date), 'yyyy-MM-dd') : null;
      return mealDate === dateStr;
    });

    // 해당 날짜의 총 칼로리 계산
    const totalCalories = dayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);

    return {
      date: format(date, 'd'),
      fullDate: dateStr,
      calories: totalCalories,
      goal: goalCalories,
      mealsCount: dayMeals.length
    };
  });

  // 평균 계산
  const avgCalories = Math.round(
    monthData.reduce((sum, day) => sum + day.calories, 0) / monthData.length
  );

  // Chart.js 데이터 (5일 간격으로 표시)
  const chartData = {
    labels: monthData
      .filter((_, i) => i % 5 === 0 || i === monthData.length - 1)
      .map(d => `${d.date}일`),
    datasets: [
      {
        label: '섭취 칼로리',
        data: monthData
          .filter((_, i) => i % 5 === 0 || i === monthData.length - 1)
          .map(d => d.calories),
        borderColor: '#66BB6A',
        backgroundColor: 'rgba(102, 187, 106, 0.1)',
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: '#66BB6A',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true,
      },
      {
        label: '목표',
        data: monthData
          .filter((_, i) => i % 5 === 0 || i === monthData.length - 1)
          .map(d => d.goal),
        borderColor: '#EF5350',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        tension: 0,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 14 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y} kcal`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 2500,
        ticks: {
          stepSize: 500,
          callback: value => value + ' kcal',
          font: { size: 12 }
        },
        grid: { color: 'rgba(0, 0, 0, 0.05)' }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } }
      }
    }
  };

  // 달력 그리드용 데이터 (빈 칸 포함)
  const firstDayOfWeek = getDay(monthStart);
  const emptyDays = Array(firstDayOfWeek).fill(null);

  const calendarData = [
    ...emptyDays,
    ...monthData
  ];

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  // 날짜 클릭
  const handleDateClick = (dayData) => {
    if (dayData && dayData.calories !== null) {
      setSelectedDate(dayData);
    }
  };

  // 모달 닫기
  const closeModal = () => {
    setSelectedDate(null);
  };

  // 🔹 로딩 중일 때
  if (loading) {
    return (
      <div className="calendar-page-container">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-page-container">
      {/* 월 네비게이션 */}
      <div className="month-navigation">
        <button className="nav-arrow-button" onClick={handlePrevMonth}>
          ← 이전 달
        </button>
        <h2 className="month-title">{monthTitle}</h2>
        <button className="nav-arrow-button" onClick={handleNextMonth}>
          다음 달 →
        </button>
      </div>

      {/* 상태 요약 */}
      <div className="status-summary">
        <h3 className="status-title">이번 달에 평균 {avgCalories}kcal 먹었어요</h3>
        <div className="status-detail">
          <span>🎯 목표 {goalCalories}kcal</span>
          <span>😊 지금까지 -{(goalCalories - avgCalories) * monthData.length}kcal</span>
        </div>
      </div>

      {/* 라인 차트 */}
      <div className="chart-section">
        <div className="chart-box">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* 달력 뷰 */}
      <div className="section-header" style={{ marginTop: '2rem' }}>
        달력 보기
      </div>

      {/* 요일 헤더 */}
      <div className="calendar-weekdays">
        {weekDays.map((day, i) => (
          <div key={i} className="weekday-label">{day}</div>
        ))}
      </div>

      {/* 월간 달력 그리드 */}
      <div className="monthly-grid">
        {calendarData.map((dayData, index) => {
          if (!dayData) {
            return <div key={index} className="calendar-cell empty-cell"></div>;
          }

          const hasData = dayData.calories > 0; // 🔹 0보다 크면 데이터 있음
          const rate = (dayData.calories / dayData.goal) * 100;
          const achieved = rate >= 90 && rate <= 110;

          return (
            <div
              key={index}
              className={`calendar-cell ${hasData ? 'has-data' : 'no-data'} ${
                achieved ? 'achieved' : 'not-achieved'
              }`}
              onClick={() => handleDateClick(dayData)}
            >
              <div className="cell-date">{dayData.date}</div>
              
              {hasData && (
                <>
                  <div className="cell-calories">
                    {(dayData.calories / 1000).toFixed(1)}k
                  </div>
                  <div className="cell-badge">
                    {achieved ? '✅' : '❌'}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* 상세 정보 모달 */}
      {selectedDate && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              ✕
            </button>
            <h3 className="modal-title">
              {format(currentDate, 'M월', { locale: ko })} {selectedDate.date}일
            </h3>
            <div className="modal-info">
              <div className="modal-row">
                <span className="modal-label">섭취 칼로리:</span>
                <span className="modal-value">{selectedDate.calories} kcal</span>
              </div>
              <div className="modal-row">
                <span className="modal-label">식사 횟수:</span>
                <span className="modal-value">{selectedDate.mealsCount}회</span>
              </div>
              <div className="modal-row">
                <span className="modal-label">목표 칼로리:</span>
                <span className="modal-value">{selectedDate.goal} kcal</span>
              </div>
              <div className="modal-row">
                <span className="modal-label">차이:</span>
                <span className="modal-value" style={{ 
                  color: selectedDate.calories - selectedDate.goal >= 0 ? '#EF5350' : '#66BB6A' 
                }}>
                  {selectedDate.calories - selectedDate.goal >= 0 ? '+' : ''}
                  {selectedDate.calories - selectedDate.goal} kcal
                </span>
              </div>
              <div className="modal-row">
                <span className="modal-label">달성 여부:</span>
                <span className="modal-value">
                  {((selectedDate.calories / selectedDate.goal) * 100 >= 90 && 
                    (selectedDate.calories / selectedDate.goal) * 100 <= 110) 
                    ? '✅ 달성' : '❌ 미달성'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyCalendarPage;