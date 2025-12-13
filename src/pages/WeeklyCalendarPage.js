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
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format,
  addWeeks,
  subWeeks
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

const WeeklyCalendarPage = () => {
  // 📌 1. 상태 선언 (현재 보고 있는 날짜)
  const [currentDate, setCurrentDate] = useState(new Date());

  // localStorage에서 목표 칼로리 불러오기
  const [goalCalories] = useState(() => {
    const saved = localStorage.getItem('goalCalories');
    return saved ? Number(saved) : 2000;
  });

  // 📌 2. 이번 주의 시작/끝 날짜 계산
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // 일요일부터
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  
  // 📌 3. 이번 주의 모든 날짜 배열로 만들기
  const weekDates = eachDayOfInterval({ start: weekStart, end: weekEnd });
  // 결과: [일요일Date, 월요일Date, 화요일Date, ..., 토요일Date]
  
  // 📌 4. 주차 표시 문자열
  const weekTitle = `${format(weekStart, 'M월 d일', { locale: ko })} ~ ${format(weekEnd, 'M월 d일', { locale: ko })}`;

  // 📌 5. 이전/다음 주 이동 함수
  const handlePrevWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1)); // 1주 전으로 이동
  };

  const handleNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1)); // 1주 후로 이동
  };

  // 📌 6. 더미 데이터 생성 (나중에 실제 데이터로 교체)
  const dummyWeekData = weekDates.map(date => ({
    date: format(date, 'M/d'),                    // "12/1"
    day: format(date, 'EEEE', { locale: ko }),   // "월요일"
    fullDate: format(date, 'yyyy-MM-dd'),        // "2024-12-01"
    calories: Math.floor(Math.random() * 500) + 1700,  // 1700~2200 랜덤
    goal: goalCalories
  }));

  // 📌 7. 평균 계산
  const avgCalories = Math.round(
    dummyWeekData.reduce((sum, day) => sum + day.calories, 0) / dummyWeekData.length
  );

  // 📌 8. 목표 달성일 계산 (목표의 90%~110% 범위면 달성)
  const achievedDays = dummyWeekData.filter(
    day => day.calories >= day.goal * 0.9 && day.calories <= day.goal * 1.1
  ).length;

  // 📌 9. Chart.js 데이터 설정
  const chartData = {
    labels: dummyWeekData.map(d => `${d.day}\n${d.date}`), // x축: "월요일\n12/1"
    datasets: [
      {
        label: '섭취 칼로리',
        data: dummyWeekData.map(d => d.calories),  // y축: [1800, 2100, ...]
        borderColor: '#4DD0E1',
        backgroundColor: 'rgba(77, 208, 225, 0.1)',
        borderWidth: 3,
        pointRadius: 5,
        pointBackgroundColor: '#4DD0E1',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true,
      },
      {
        label: '목표',
        data: dummyWeekData.map(d => d.goal),  // y축: [2000, 2000, ...]
        borderColor: '#EF5350',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],  // 점선
        pointRadius: 0,
        tension: 0,
      }
    ]
  };

  // 📌 10. Chart.js 옵션
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
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
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
          callback: function(value) {
            return value + ' kcal';
          },
          font: { size: 12 }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: { size: 12 }
        }
      }
    }
  };

  // 📌 11. 화면 렌더링 (return은 한 번만!)
  return (
    <div className="calendar-page-container">
      {/* 주차 네비게이션 */}
      <div className="week-navigation">
        <button className="nav-arrow-button" onClick={handlePrevWeek}>
          ← 이전 주
        </button>
        <h2 className="week-title">{weekTitle}</h2>
        <button className="nav-arrow-button" onClick={handleNextWeek}>
          다음 주 →
        </button>
      </div>

      {/* 상태 요약 */}
      <div className="status-summary">
        <h3 className="status-title">이번 주에 평균 {avgCalories}kcal 먹었어요</h3>
        <div className="status-detail">
          <span>🎯 목표 {goalCalories}kcal</span>
          <span>😊 지금까지 -{(goalCalories - avgCalories) * 7}kcal</span>
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
        <button className="period-tab active">주간</button>
        <button className="period-tab">월간</button>
      </div> */}

      {/* 통계 카드 */}
      <div className="week-summary" style={{ marginTop: '2rem' }}>
        <div className="summary-card-small">
          <div className="summary-label">주간 평균</div>
          <div className="summary-value-small">{avgCalories} kcal</div>
        </div>
        <div className="summary-card-small">
          <div className="summary-label">달성일</div>
          <div className="summary-value-small">{achievedDays}일 / 7일</div>
        </div>
        <div className="summary-card-small">
          <div className="summary-label">달성률</div>
          <div className="summary-value-small">
            {Math.round((achievedDays / 7) * 100)}%
          </div>
        </div>
      </div>

        {/* 일별 상세 테이블 */}
        <div className="section-header" style={{ marginTop: '2rem' }}>
        일별 상세
        </div>

        <div className="weekly-table-container">
        <table className="weekly-table">
            <thead>
            <tr>
                <th>날짜</th>
                <th>요일</th>
                <th>섭취 칼로리</th>
                <th>목표</th>
                <th>차이</th>
                <th>달성</th>
            </tr>
            </thead>
            <tbody>
            {dummyWeekData.map((dayData, index) => {
                const rate = (dayData.calories / dayData.goal) * 100;
                const status = 
                rate >= 90 && rate <= 110 ? 'success' :
                rate < 90 ? 'under' : 'over';
                const diff = dayData.calories - dayData.goal;
                
                return (
                <tr key={index} className={`table-row-${status}`}>
                    <td className="date-cell">{dayData.date}</td>
                    <td className="day-cell">{dayData.day}</td>
                    <td className="calories-cell">
                    <strong>{dayData.calories}</strong> kcal
                    </td>
                    <td className="goal-cell">{dayData.goal} kcal</td>
                    <td className={`diff-cell ${diff >= 0 ? 'over' : 'under'}`}>
                    {diff >= 0 ? '+' : ''}{diff} kcal
                    </td>
                    <td className="status-cell">
                    {status === 'success' && <span className="status-badge success">✅ 달성</span>}
                    {status === 'under' && <span className="status-badge under">⚠️ 부족</span>}
                    {status === 'over' && <span className="status-badge over">❌ 초과</span>}
                    </td>
                </tr>
                );
            })}
            </tbody>
        </table>
        </div>
    </div>
  );
};

export default WeeklyCalendarPage;