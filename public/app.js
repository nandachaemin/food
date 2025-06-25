// app.js

// 세션 데이터 (새로고침 시 초기화)
let sessionData = {
  image: null,
  result: null
};

const photoInput = document.getElementById('photo-input');
const preview = document.getElementById('preview');
const analyzeBtn = document.getElementById('analyze-btn');
const resultSection = document.getElementById('result-section');
const resultFood = document.getElementById('result-food');
const resultCalorie = document.getElementById('result-calorie');
const resultExercise = document.getElementById('result-exercise');
const resultDetails = document.getElementById('result-details');
const copyBtn = document.getElementById('copy-btn');
const resetBtn = document.getElementById('reset-btn');

// 이미지 업로드/촬영 핸들러
photoInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    preview.innerHTML = `<img src="${ev.target.result}" alt="preview" />`;
    sessionData.image = ev.target.result;
    analyzeBtn.disabled = false;
  };
  reader.readAsDataURL(file);
});

// 칼로리 분석 버튼
analyzeBtn.addEventListener('click', async () => {
  if (!sessionData.image) return;
  analyzeBtn.disabled = true;
  analyzeBtn.textContent = '분석 중...';
  try {
    const result = await analyzeImageWithGemini(sessionData.image);
    sessionData.result = result;
    showResult(result);
  } catch (err) {
    alert('분석에 실패했습니다. 다시 시도해 주세요.');
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = '칼로리 분석하기';
  }
});

// 결과 표시 함수
function showResult(result) {
  resultSection.style.display = 'block';
  document.getElementById('upload-section').style.display = 'none';
  resultFood.textContent = `음식명: ${result.food}`;
  resultCalorie.textContent = `예상 칼로리: ${result.calorie} kcal`;
  resultExercise.textContent = `운동량: ${result.exercise}`;
  resultDetails.innerHTML = '';
  result.details.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    resultDetails.appendChild(li);
  });
}

// 결과 복사 버튼
copyBtn.addEventListener('click', () => {
  if (!sessionData.result) return;
  const text = `음식명: ${sessionData.result.food}\n예상 칼로리: ${sessionData.result.calorie} kcal\n운동량: ${sessionData.result.exercise}\n- ${sessionData.result.details.join('\n- ')}`;
  navigator.clipboard.writeText(text).then(() => {
    copyBtn.textContent = '복사됨!';
    setTimeout(() => { copyBtn.textContent = '결과 복사'; }, 1200);
  });
});

// 다시하기 버튼
resetBtn.addEventListener('click', () => {
  sessionData = { image: null, result: null };
  preview.innerHTML = '';
  photoInput.value = '';
  analyzeBtn.disabled = true;
  analyzeBtn.textContent = '칼로리 분석하기';
  resultSection.style.display = 'none';
  document.getElementById('upload-section').style.display = 'flex';
});

// Gemini API 연동 함수
async function analyzeImageWithGemini(imageDataUrl) {
  // base64 추출
  const base64 = imageDataUrl.split(',')[1];
  // Gemini 1.5 Flash API 호출
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + GEMINI_API_KEY;
  const prompt = `아래 이미지는 음식 사진입니다.\n1. 음식명을 한글로 알려줘.\n2. 예상 칼로리를 숫자(kcal)로 알려줘.\n3. 500kcal 기준이면, 태우기 위한 운동량(예: 달리기 10km, 등산 30분 등)도 알려줘.\n4. 칼로리 계산과정을 bullet 형태로 3개 이상 보여줘.\n5. 답변은 JSON 형식으로 아래 예시처럼 해줘.\n{\n  \"food\": \"음식명\",\n  \"calorie\": 500,\n  \"exercise\": \"달리기 10km\",\n  \"details\": [\n    \"계산과정1\",\n    \"계산과정2\",\n    \"계산과정3\"\n  ]\n}`;
  const body = {
    contents: [
      { parts: [ { text: prompt } ] },
      { parts: [ { inlineData: { mimeType: 'image/jpeg', data: base64 } } ] }
    ]
  };
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  // Gemini 응답 파싱
  let text = '';
  try {
    text = data.candidates[0].content.parts[0].text;
    // JSON 파싱
    const json = JSON.parse(text);
    return json;
  } catch (e) {
    throw new Error('API 응답 파싱 실패');
  }
}

// 모바일에서 스크롤/키보드 대응 등 추가 UX 개선 필요시 여기에 작성 