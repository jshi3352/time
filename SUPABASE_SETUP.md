# 🚀 Supabase 데이터베이스 설정 가이드

이 가이드는 공수달력 프로젝트에 Supabase 클라우드 데이터베이스를 연동하는 방법을 설명합니다.

## 📋 목차
1. [Supabase 계정 생성](#1-supabase-계정-생성)
2. [프로젝트 생성](#2-프로젝트-생성)
3. [데이터베이스 스키마 설정](#3-데이터베이스-스키마-설정)
4. [환경 변수 설정](#4-환경-변수-설정)
5. [테스트 및 배포](#5-테스트-및-배포)

## 1. Supabase 계정 생성

1. [Supabase 웹사이트](https://supabase.com)에 접속
2. "Start your project" 클릭
3. GitHub, Google, 또는 이메일로 회원가입
4. 이메일 인증 완료

## 2. 프로젝트 생성

1. Supabase 대시보드에서 "New Project" 클릭
2. 프로젝트 정보 입력:
   - **Name**: `gongsoo-calendar` (또는 원하는 이름)
   - **Database Password**: 강력한 비밀번호 설정 (기억해두세요!)
   - **Region**: `Northeast Asia (Seoul)` 선택 (한국 사용자에게 최적)
3. "Create new project" 클릭
4. 프로젝트 생성 완료까지 2-3분 대기

## 3. 데이터베이스 스키마 설정

### 3.1 SQL Editor 접속
1. 프로젝트 대시보드에서 "SQL Editor" 메뉴 클릭
2. "New query" 버튼 클릭

### 3.2 스키마 생성
`database-schema.sql` 파일의 내용을 복사하여 SQL Editor에 붙여넣기:

```sql
-- 이 파일의 전체 내용을 복사하여 실행하세요
-- database-schema.sql 파일 참조
```

### 3.3 스키마 실행
1. "Run" 버튼 클릭하여 스키마 생성
2. 성공 메시지 확인

## 4. 환경 변수 설정

### 4.1 API 키 확인
1. 프로젝트 대시보드에서 "Settings" → "API" 메뉴 클릭
2. 다음 정보 복사:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: `eyJ...` (긴 토큰)

### 4.2 설정 파일 생성
프로젝트 루트에 `supabase-config.js` 파일 생성:

```javascript
// supabase-config.js
window.SUPABASE_CONFIG = {
    url: 'https://your-project-id.supabase.co',
    anonKey: 'your-anon-key-here'
};
```

### 4.3 HTML 파일에 설정 추가
`index.html`과 `login.html`에 설정 파일 추가:

```html
<!-- Supabase 설정 -->
<script src="supabase-config.js"></script>
```

## 5. 테스트 및 배포

### 5.1 로컬 테스트
1. 로컬 서버 실행:
   ```bash
   # PowerShell에서 실행
   python -m http.server 8000
   # 또는
   npx serve .
   ```

2. 브라우저에서 `http://localhost:8000` 접속
3. 회원가입/로그인 테스트
4. 데이터 저장/로드 테스트

### 5.2 GitHub Pages 배포
1. GitHub 저장소에 코드 업로드
2. Settings → Pages에서 배포 설정
3. 배포된 사이트에서 기능 테스트

## 🔧 문제 해결

### 연결 오류
- API URL과 키가 정확한지 확인
- 브라우저 개발자 도구에서 네트워크 오류 확인
- CORS 설정 확인 (Supabase는 기본적으로 모든 도메인 허용)

### 인증 오류
- Row Level Security (RLS) 정책이 올바르게 설정되었는지 확인
- 사용자가 로그인되어 있는지 확인

### 데이터 저장 오류
- 테이블 스키마가 올바르게 생성되었는지 확인
- 필수 필드가 모두 제공되었는지 확인

## 💰 비용 정보

### 무료 플랜 (Free Tier)
- **데이터베이스**: 500MB
- **대역폭**: 5GB/월
- **사용자**: 50,000명/월
- **API 요청**: 무제한
- **실시간 연결**: 200개 동시 연결

### 유료 플랜 (Pro)
- **월 $25**부터 시작
- 더 많은 저장공간과 대역폭
- 고급 기능 및 지원

## 📚 추가 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [JavaScript 클라이언트 가이드](https://supabase.com/docs/reference/javascript)
- [Row Level Security 가이드](https://supabase.com/docs/guides/auth/row-level-security)

## 🎉 완료!

설정이 완료되면 다음 기능들을 사용할 수 있습니다:

✅ **클라우드 데이터 저장**: 작업 데이터가 클라우드에 자동 저장  
✅ **다중 기기 동기화**: 여러 기기에서 동일한 데이터 접근  
✅ **사용자 인증**: 안전한 로그인/회원가입 시스템  
✅ **실시간 동기화**: 데이터 변경사항 실시간 반영  
✅ **백업 및 복구**: 데이터 손실 방지  

문제가 발생하면 브라우저 개발자 도구의 콘솔을 확인하거나, Supabase 대시보드의 로그를 확인해보세요!