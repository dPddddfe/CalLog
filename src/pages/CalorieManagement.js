import React, { useState } from 'react';

// --- 더미 데이터 (최근 7일) ---
const getDummyData = (goal) => {
    const today = new Date();
    const labels = [];
    const calories = [];
    const protein = [];
    const carbs = [];
    const sugar = [];

    // 목표 칼로리에 기반한 목표 매크로 설정 (단위: g)
    const targetProtein = goal * 0.25 / 4; // 단백질: 4 kcal/g
    const targetCarbs = goal * 0.55 / 4;   // 탄수화물: 4 kcal/g
    const targetSugarMax = goal * 0.1 / 4; // WHO 권장: 총 칼로리의 10% 미만

    // 과거 7일 데이터 생성 (오늘 포함)
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        labels.push(date.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace(/\. /g, '/').replace('.', ''));
        
        // --- 랜덤 매크로 생성 ---
        let p = Math.round(targetProtein + (Math.random() * 40 - 20)); 
        let c = Math.round(targetCarbs + (Math.random() * 80 - 40));   
        let s = Math.round(Math.min(c * 0.3, targetSugarMax + (Math.random() * 10 - 5))); 

        const currentProtein = Math.max(30, p);
        const currentCarbs = Math.max(100, c);
        const currentSugar = Math.max(5, s);

        const cal = (currentProtein * 4) + (currentCarbs * 4); 

        protein.push(currentProtein);
        carbs.push(currentCarbs);
        sugar.push(currentSugar);
        calories.push(cal);
    }
    
    return { labels, calories, protein, carbs, sugar };
};


const CalorieManagementPage = () => {
    const [goalCalories, setGoalCalories] = useState(2000); 
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [newGoal, setNewGoal] = useState(goalCalories);

    const { calories, protein, carbs, sugar } = getDummyData(goalCalories);

    // --- 주간 평균 계산 ---
    const calculateAvg = (arr) => Math.round(arr.reduce((sum, val) => sum + val, 0) / arr.length);

    const avgCalories = calculateAvg(calories);
    const avgProtein = calculateAvg(protein);
    const avgCarbs = calculateAvg(carbs);
    const avgSugar = calculateAvg(sugar);

    // 목표 매크로 (평균 섭취량 비교를 위한 기준값)
    const goalProtein = Math.round(goalCalories * 0.25 / 4);
    const goalCarbs = Math.round(goalCalories * 0.55 / 4);
    const goalSugarMax = Math.round(goalCalories * 0.1 / 4); // 최대 권장량 (g)

    // 목표 칼로리 업데이트 핸들러
    const handleGoalUpdate = () => {
        const parsedGoal = parseInt(newGoal, 10);
        if (parsedGoal > 500 && parsedGoal !== goalCalories) {
            setGoalCalories(parsedGoal);
        }
        setIsEditingGoal(false);
    };

    // 재활용 가능한 통계 카드 컴포넌트
    const StatCard = ({ title, value, unit, color, isGoal, goalValue, isGoalSetting }) => {
        const diff = goalValue ? value - goalValue : null;
        const diffColor = diff > 0 ? 'text-red-600' : diff < 0 ? 'text-blue-600' : 'text-gray-600';

        // isGoalSetting 플래그를 사용하여 배경색을 토글
        const cardClass = isGoalSetting 
            ? `summary-card goal-setting-card bg-white border-l-4 border-gray-400`
            : `summary-card bg-white border-l-4 border-${color}-400`;

        return (
            <div className={`${cardClass} p-5 rounded-xl shadow-lg transition duration-300 hover:shadow-xl`}>
                <div className="card-title text-gray-700 text-base font-semibold mb-1">{title}</div>
                <div className={`card-value text-3xl font-bold text-gray-900 mb-1`}>
                    {value} <span className="unit text-xl font-normal text-gray-500">{unit}</span>
                </div>
                {isGoal && goalValue !== null && (
                    <div className="text-sm font-medium text-gray-600 mt-2 border-t pt-2">
                        {/* 당류 목표는 '최대 권장'으로 표시 */}
                        목표{unit === 'g' && color === 'pink' ? ' (최대)' : ''}: {goalValue} {unit}
                        {goalValue > 0 && (
                            <span className={`ml-2 ${diffColor}`}>
                                ({diff >= 0 ? '+' : ''}{diff} {unit})
                            </span>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // 모든 CSS 스타일을 <style> 태그 내에 삽입
    const styles = `
        /* 색상 변수 */
        :root {
            --color-light-yellow: #FFF8E1; 
            --color-dark-green: #4CAF50; /* Primary Green */
            --color-light-green: #81C784; 
            --color-white: #FFFFFF;
            --color-text-dark: #212121;
            --color-text-light: #616161;
            --color-border-light: #E0E0E0;
            --color-shadow-light: rgba(0, 0, 0, 0.1);
            --color-highlight-bg: #F1F8E9; /* Very Light Green - Goal Card Background */
            --color-stat-bg: #E8F5E9; /* Stat Card Background */
        }

        .calorie-management-wrapper {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem 1rem;
            display: flex;
            flex-direction: column;
            gap: 2rem;
            font-family: 'Inter', sans-serif;
        }

        .header-title {
            font-size: 1.8rem;
            font-weight: 800;
            color: var(--color-dark-green);
            display: flex;
            align-items: center;
            margin-bottom: 0.5rem;
        }

        /* 요약 카드 그리드 - 3열 레이아웃 유지 */
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); /* 최소 크기 조정 */
            gap: 1.5rem;
        }
        
        /* 기본 카드 스타일 */
        .summary-card {
            background-color: var(--color-white);
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 4px 12px var(--color-shadow-light);
            transition: transform 0.2s;
            position: relative;
            overflow: hidden;
        }
        
        /* 목표 설정 카드 스타일 */
        .goal-setting-card {
            background-color: var(--color-highlight-bg) !important; /* 배경색 강조 */
            border-left: 5px solid var(--color-dark-green);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        .card-title {
            font-size: 1rem;
            font-weight: 600;
            color: var(--color-text-light);
            margin-bottom: 5px;
        }

        .card-value {
            font-size: 2.2rem;
            font-weight: bold;
            color: var(--color-text-dark);
            line-height: 1.2;
            display: flex;
            align-items: baseline;
            gap: 5px;
        }
        
        .card-value .unit {
            font-size: 1.2rem;
            font-weight: normal;
            color: var(--color-text-light);
        }

        /* 목표 설정 UI */
        .goal-input {
            width: 100px;
            padding: 8px 10px;
            border: 1px solid var(--color-border-light);
            border-radius: 8px;
            font-size: 1rem;
            outline: none;
            transition: border-color 0.2s;
            margin-right: 5px;
        }

        .goal-input:focus {
            border-color: var(--color-light-green);
        }

        .edit-button, .save-button {
            padding: 8px 15px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            font-weight: 600;
            transition: background-color 0.2s, box-shadow 0.2s;
            white-space: nowrap;
        }

        .edit-button {
            background-color: #E0E0E0;
            color: var(--color-text-dark);
        }

        .save-button {
            background-color: var(--color-dark-green);
            color: var(--color-white);
        }

        .edit-button:hover { background-color: #CCCCCC; }
        .save-button:hover { background-color: #388E3C; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); }

        /* 매크로 섹션 헤더 */
        .macro-section-header {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--color-dark-green);
            border-bottom: 3px solid var(--color-light-green);
            padding-bottom: 0.5rem;
            margin-top: 1rem;
        }

        /* 반응형 */
        @media (max-width: 900px) {
             /* 900px 이하에서는 2열로 변경 */
            .summary-grid {
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            }
        }
        @media (max-width: 600px) {
            /* 모바일에서는 1열 */
            .summary-grid {
                grid-template-columns: 1fr;
            }
            .card-value {
                font-size: 1.8rem;
            }
            .card-value .unit {
                font-size: 1rem;
            }
        }
    `;


    return (
        <>
            <style>{styles}</style>
            <div className="calorie-management-wrapper">
                <h2 className="header-title">
                    영양소 관리 대시보드
                </h2>
                
                {/* 1. 목표 및 주간 칼로리 요약 영역 */}
                <div className="summary-grid">
                    {/* 1-1. 목표 칼로리 카드 (액션) */}
                    <div className="summary-card goal-setting-card">
                        <div className="card-title">일일 목표 칼로리</div>
                        <div className="card-value">
                            {isEditingGoal ? (
                                <div className="flex items-center">
                                    <input 
                                        type="number" 
                                        value={newGoal} 
                                        onChange={(e) => setNewGoal(e.target.value)} 
                                        className="goal-input"
                                        min="500"
                                    />
                                    <span className="unit">kcal</span>
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    {goalCalories} <span className="unit">kcal</span>
                                </div>
                            )}
                        </div>
                        <div className="mt-4">
                            {isEditingGoal ? (
                                <button onClick={handleGoalUpdate} className="save-button w-full">목표 저장</button>
                            ) : (
                                <button onClick={() => { setNewGoal(goalCalories); setIsEditingGoal(true); }} className="edit-button w-full">목표 수정</button>
                            )}
                        </div>
                    </div>

                    {/* 1-2. 주간 목표 달성일 수 카드 (KPI: High-level success) - 두 번째로 배치 */}
                    <StatCard 
                        title="주간 목표 달성일 수"
                        value={calories.filter(cal => cal <= goalCalories * 1.1 && cal >= goalCalories * 0.9).length}
                        unit="/ 7일"
                        color="yellow"
                        isGoalSetting={false}
                    />
                    
                    {/* 1-3. 주간 평균 섭취 칼로리 카드 (KPI: Data) - 세 번째로 배치 */}
                    <StatCard 
                        title="주간 평균 섭취 칼로리"
                        value={avgCalories}
                        unit="kcal"
                        color="green"
                        isGoal={true}
                        goalValue={goalCalories}
                        isGoalSetting={false}
                    />
                </div>

                {/* 2. 주요 영양소 주간 평균 영역 */}
                <h3 className="macro-section-header">주요 영양소 주간 평균 섭취량 (g)</h3>
                <div className="summary-grid">
                    {/* 단백질 카드 */}
                    <StatCard 
                        title="단백질 평균"
                        value={avgProtein}
                        unit="g"
                        color="indigo"
                        isGoal={true}
                        goalValue={goalProtein}
                    />
                    
                    {/* 탄수화물 카드 */}
                    <StatCard 
                        title="탄수화물 평균"
                        value={avgCarbs}
                        unit="g"
                        color="orange"
                        isGoal={true}
                        goalValue={goalCarbs}
                    />
                    
                    {/* 당류 카드 (최대 권장량 비교) */}
                    <StatCard 
                        title="당류 평균"
                        value={avgSugar}
                        unit="g"
                        color="pink"
                        isGoal={true}
                        goalValue={goalSugarMax} 
                    />
                </div>

            </div>
        </>
    );
};

export default CalorieManagementPage;