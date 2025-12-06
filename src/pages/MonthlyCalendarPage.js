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
  // 30일치 더미 데이터
  const dummyMonthData = Array.from({ length: 30 }, (_, i) => ({
    date: i + 1,
    calories: Math.floor(Math.random() * 500) + 1700, // 1700~2200
    goal: 2000
  }));

  const [currentMonth, setCurrentMonth] = useState('2024년 12월');
  const [selectedDate, setSelectedDate] = useState(null);

  // 평균 계산
  const avgCalories = Math.round(
    dummyMonthData.reduce((sum, day) => sum + day.calories, 0) / 30
  );

  // Chart.js 데이터 (월간은 5일 간격으로 표시)
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
  const calendarData = [
    null, null, null, null, null, // 1일이 토요일이라고 가정
    ...dummyMonthData
  ];

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="calendar-page-container">
      {/* 월 네비게이션 */}
      <div className="month-navigation">
        <button className="nav-arrow-button">← 이전 달</button>
        <h2 className="month-title">{currentMonth}</h2>
        <button className="nav-arrow-button">다음 달 →</button>
      </div>

      {/* 상태 요약 */}
      <div className="status-summary">
        <h3 className="status-title">이번 달에 평균 {avgCalories}kcal 먹었어요</h3>
        <div className="status-detail">
          <span>🎯 목표 2000kg</span>
          <span>😊 지금까지 -{(2000 - avgCalories) * 30}kcal</span>
        </div>
      </div>

      {/* 라인 차트 */}
      <div className="chart-section">
        <div className="chart-box">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* 탭 버튼 */}
      <div className="period-tabs">
        <button className="period-tab">일간</button>
        <button className="period-tab">주간</button>
        <button className="period-tab active">월간</button>
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

          const hasData = dayData.calories !== null;
          const rate = (dayData.calories / dayData.goal) * 100;
          const achieved = rate >= 90 && rate <= 110;

          return (
            <div
              key={index}
              className={`calendar-cell ${hasData ? 'has-data' : 'no-data'} ${
                achieved ? 'achieved' : 'not-achieved'
              }`}
              onClick={() => setSelectedDate(dayData)}
            >
              <div className="cell-date">{dayData.date}</div>
              {hasData && (
                <>
                  <div className="cell-calories">
                    {(dayData.calories / 1000).toFixed(1)}k
                  </div>
                  <div className="cell-badge">{achieved ? '✅' : '❌'}</div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* 모달 */}
      {selectedDate && (
        <div className="modal-overlay" onClick={() => setSelectedDate(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedDate(null)}>
              ✕
            </button>
            <h3 className="modal-title">12월 {selectedDate.date}일</h3>
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