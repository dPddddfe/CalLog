// src/api/edamam.js

const APP_ID = process.env.REACT_APP_EDAMAM_ID;
const APP_KEY = process.env.REACT_APP_EDAMAM_KEY;

function ensureEnv() {
  if (!APP_ID || !APP_KEY) {
    throw new Error(
      'Edamam API 환경변수(REACT_APP_EDAMAM_ID / REACT_APP_EDAMAM_KEY)가 설정되지 않았습니다.'
    );
  }
}

function getQty(nutrientsObj, code) {
  if (!nutrientsObj) return 0;
  const n = nutrientsObj[code];
  if (!n) return 0;
  return n.quantity || 0;
}

/**
 * @param {string} foodName 예: "1 apple", "100g chicken breast"
 */
export async function fetchNutritionFromEdamam(foodName) {
  ensureEnv();

  if (!foodName || !foodName.trim()) {
    throw new Error('foodName(음식 이름)이 비어 있습니다.');
  }

  const baseUrl = 'https://api.edamam.com/api/nutrition-data';

  const params = new URLSearchParams({
    app_id: APP_ID,
    app_key: APP_KEY,
    ingr: foodName.trim(),
  });

  const url = `${baseUrl}?${params.toString()}`;

  console.log('[Edamam] 요청 foodName:', foodName);
  console.log('[Edamam] 요청 URL:', url);

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Edamam API 요청 실패 (status: ${res.status})`);
  }

  const data = await res.json();
  console.log('[Edamam] 원본 data:', data);

  // 1) 혹시라도 top-level에 들어있는 경우 먼저 시도
  const rootNutrients = data.totalNutrients || {};
  let calories = data.calories || 0;
  let carbs = getQty(rootNutrients, 'CHOCDF');
  let sugar = getQty(rootNutrients, 'SUGAR');
  let protein = getQty(rootNutrients, 'PROCNT');

  // 2) 위 값들이 0이면 ingredients 쪽도 한 번 더 파보기
  const ing0 = data.ingredients && data.ingredients[0];
  const parsed0 = ing0 && ing0.parsed && ing0.parsed[0];
  const ingrNutrients = parsed0 && parsed0.nutrients ? parsed0.nutrients : {};

  if (!calories) {
    calories = getQty(ingrNutrients, 'ENERC_KCAL');
  }
  if (!carbs) {
    carbs = getQty(ingrNutrients, 'CHOCDF');
  }
  if (!sugar) {
    sugar = getQty(ingrNutrients, 'SUGAR');
  }
  if (!protein) {
    protein = getQty(ingrNutrients, 'PROCNT');
  }

  calories = Math.round(calories || 0);
  carbs = Math.round(carbs || 0);
  sugar = Math.round(sugar || 0);
  protein = Math.round(protein || 0);

  console.log('[Edamam] 파싱된 값:', {
    calories,
    carbs,
    sugar,
    protein,
  });

  return { calories, carbs, sugar, protein };
}
