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
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format,
  addWeeks,
  subWeeks,
  parseISO,
  isWithinInterval
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mealsData, setMealsData] = useState([]); // 🔹 API 데이터 저장
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

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDates = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const weekTitle = `${format(weekStart, 'M월 d일', { locale: ko })} ~ ${format(weekEnd, 'M월 d일', { locale: ko })}`;

  const handlePrevWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };

  const handleNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  // 🔹 실제 데이터 처리 (날짜별로 그룹화)
  const weekData = weekDates.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // 해당 날짜의 모든 식사 필터링
    const dayMeals = mealsData.filter(meal => {
      // meal.date가 ISO 문자열이라고 가정 (예: "2024-12-19T10:30:00.000Z")
      // API 응답 구조에 따라 수정 필요!
      const mealDate = meal.date ? format(parseISO(meal.date), 'yyyy-MM-dd') : null;
      return mealDate === dateStr;
    });

    // 해당 날짜의 총 칼로리 계산
    const totalCalories = dayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);

    return {
      date: format(date, 'M/d'),
      day: format(date, 'EEEE', { locale: ko }),
      fullDate: dateStr,
      calories: totalCalories,
      goal: goalCalories,
      mealsCount: dayMeals.length
    };
  });

  // 평균 계산
  const avgCalories = Math.round(
    weekData.reduce((sum, day) => sum + day.calories, 0) / weekData.length
  );

  // 목표 달성일 계산
  const achievedDays = weekData.filter(
    day => day.calories >= day.goal * 0.9 && day.calories <= day.goal * 1.1
  ).length;

  // Chart.js 데이터 설정
  const chartData = {
    labels: weekData.map(d => `${d.day}\n${d.date}`),
    datasets: [
      {
        label: '섭취 칼로리',
        data: weekData.map(d => d.calories),
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
        data: weekData.map(d => d.goal),
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
            {weekData.map((dayData, index) => {
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
                    {dayData.mealsCount > 0 && (
                      <span style={{ fontSize: '0.85rem', color: '#999', marginLeft: '8px' }}>
                        ({dayData.mealsCount}개 식사)
                      </span>
                    )}
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