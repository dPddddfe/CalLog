// .env 에서 ID / KEY 읽어오기
const APP_ID = process.env.REACT_APP_EDAMAM_ID;
const APP_KEY = process.env.REACT_APP_EDAMAM_KEY;

// 간단한 방어 로직: env가 비어 있으면 바로 에러를 던져서 눈에 띄게 하기
function ensureEnv() {
  if (!APP_ID || !APP_KEY) {
    throw new Error(
      'Edamam API 환경변수(REACT_APP_EDAMAM_ID / REACT_APP_EDAMAM_KEY)가 설정되지 않았습니다.'
    );
  }
}

/**
 * Edamam Nutrition Data API를 호출해서
 *  - 칼로리
 *  - 탄수화물(g)
 *  - 당류(g)
 *  - 단백질(g)
 * 을 가져오는 함수.
 *
 * @param {string} foodName 사용자가 입력한 음식 이름 (예: "1 apple", "200g rice")
 * @returns {Promise<{ calories: number, carbs: number, sugar: number, protein: number }>}
 */
export async function fetchNutritionFromEdamam(foodName) {
  ensureEnv();
  console.log("[Edamam] 요청 foodName:", foodName);

  if (!foodName || !foodName.trim()) {
    throw new Error('foodName(음식 이름)이 비어 있습니다.');
  }

  // Edamam Nutrition Data API 엔드포인트
  // 문서: https://api.edamam.com/api/nutrition-data
  const baseUrl = 'https://api.edamam.com/api/nutrition-data';

  // ingr 파라미터에 음식 설명을 그대로 넣는다.
  // 예: "1 apple", "100g chicken breast" 등
  const params = new URLSearchParams({
    app_id: APP_ID,
    app_key: APP_KEY,
    ingr: foodName.trim(),
  });

  const url = `${baseUrl}?${params.toString()}`;

  // 실제 HTTP 요청
  const res = await fetch(url);
  console.log("[Edamam] 요청 URL:", url); 

  if (!res.ok) {
    throw new Error(`Edamam API 요청 실패 (status: ${res.status})`);
  }

  const data = await res.json();
  console.log("[Edamam] 응답 data:", data);  

  // Edamam 응답 구조에서 필요한 값 꺼내기
  // 단위는 kcal, g 기준
  const calories = Math.round(data.calories || 0);

  // totalNutrients 객체 안에 각 영양소가 들어 있음
  const nutrients = data.totalNutrients || {};

  const carbs   = nutrients.CHOCDF ? Math.round(nutrients.CHOCDF.quantity || 0) : 0;
const sugar   = nutrients.SUGAR  ? Math.round(nutrients.SUGAR.quantity  || 0) : 0;
const protein = nutrients.PROCNT ? Math.round(nutrients.PROCNT.quantity || 0) : 0;

console.log("[Edamam] 파싱된 값:",
  "calories:", calories,
  "carbs:", carbs,
  "sugar:", sugar,
  "protein:", protein
);

return { calories, carbs, sugar, protein };
}