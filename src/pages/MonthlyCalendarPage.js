import React, { useState } from 'react';
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
  getDay
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
  
  // 🔹 localStorage에서 목표 칼로리 불러오기
  const [goalCalories, setGoalCalories] = useState(() => {
    const saved = localStorage.getItem('goalCalories');
    return saved ? Number(saved) : 2000;
  });

  // 이번 달의 시작/끝 날짜
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  const monthDates = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // 월 표시
  const monthTitle = format(currentDate, 'yyyy년 M월', { locale: ko });

  // 이전/다음 달 이동
  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  // 🔹 더미 데이터 (실제 목표 칼로리 사용)
  const dummyMonthData = monthDates.map(date => ({
    date: format(date, 'd'),
    fullDate: format(date, 'yyyy-MM-dd'),
    calories: Math.floor(Math.random() * 500) + 1700, // 1700~2200
    goal: goalCalories  // ← localStorage에서 가져온 값!
  }));

  // 평균 계산
  const avgCalories = Math.round(
    dummyMonthData.reduce((sum, day) => sum + day.calories, 0) / dummyMonthData.length
  );

  // Chart.js 데이터 (5일 간격으로 표시)
  const chartData = {
    labels: dummyMonthData
      .filter((_, i) => i % 5 === 0 || i === dummyMonthData.length - 1)
      .map(d => `${d.date}일`),
    datasets: [
      {
        label: '섭취 칼로리',
        data: dummyMonthData
          .filter((_, i) => i % 5 === 0 || i === dummyMonthData.length - 1)
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
        data: dummyMonthData
          .filter((_, i) => i % 5 === 0 || i === dummyMonthData.length - 1)
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
  const firstDayOfWeek = getDay(monthStart); // 0=일요일, 1=월요일...
  const emptyDays = Array(firstDayOfWeek).fill(null);

  const calendarData = [
    ...emptyDays,
    ...dummyMonthData
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
          <span>😊 지금까지 -{(goalCalories - avgCalories) * dummyMonthData.length}kcal</span>
        </div>
      </div>

      {/* 라인 차트 */}
      <div className="chart-section">
        <div className="chart-box">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* 탭 버튼
      <div className="period-tabs">
        <button className="period-tab">일간</button>
        <button className="period-tab">주간</button>
        <button className="period-tab active">월간</button>
      </div> */}

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
            // 빈 칸 (이전/다음 달)
            return <div key={index} className="calendar-cell empty-cell"></div>;
          }

          const hasData = dayData.calories !== null;
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