// src/api/mealsApi.js
const MOCK_API_URL = "https://693f646312c964ee6b6fcad6.mockapi.io/meals";

// 전체 식단 조회
export const fetchMeals = async () => {
  const res = await fetch(MOCK_API_URL);
  if (!res.ok) throw new Error("식단 불러오기 실패");
  return res.json();
};

// 새로운 식단 추가
export const addMeal = async (meal) => {
  const res = await fetch(MOCK_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(meal),
  });
  if (!res.ok) throw new Error("식단 추가 실패");
  return res.json();
};
