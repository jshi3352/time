// Supabase 설정 파일 템플릿
// 이 파일을 'supabase-config.js'로 복사하고 실제 값으로 수정하세요

// 1. Supabase 프로젝트 대시보드에서 Settings → API로 이동
// 2. Project URL과 anon public key를 복사하여 아래에 입력

window.SUPABASE_CONFIG = {
    // 예: 'https://abcdefghijklmnop.supabase.co'
    url: 'YOUR_SUPABASE_PROJECT_URL_HERE',
    
    // 예: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    anonKey: 'YOUR_SUPABASE_ANON_KEY_HERE'
};

// 설정 완료 후:
// 1. 이 파일을 'supabase-config.js'로 이름 변경
// 2. index.html과 login.html에 다음 스크립트 태그 추가:
//    <script src="supabase-config.js"></script>
// 3. 브라우저에서 테스트