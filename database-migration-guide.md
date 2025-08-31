# 🗄️ 데이터베이스 마이그레이션 가이드

## 📊 현재 프로젝트 데이터 구조 분석

### 현재 사용 중인 데이터 저장 방식
현재 **공수달력** 프로젝트는 브라우저의 `localStorage`를 사용하여 데이터를 저장합니다:

```javascript
// 현재 데이터 구조 (app.js)
const appState = {
    workData: {}, // 날짜별 공수 데이터 (형식: 'YYYY-MM-DD': { workDays: 1, workHours: 8, rate: 150000, memo: '메모' })
    settings: {
        defaultDailyRate: 150000,
        defaultHourlyRate: 18750,
        defaultWorkDays: '1.0'
    }
};

// 관리자 페이지 데이터 (admin.js)
- 광고 설정 (AdSense, 표시 설정, 분석 설정)
- 광고 슬롯 데이터
- 광고 스크립트 데이터
- 계정 정보 (사용자명, 비밀번호)
```

### 현재 데이터의 한계점
- ❌ **브라우저 종속**: 브라우저 데이터 삭제 시 모든 데이터 손실
- ❌ **동기화 불가**: 여러 기기 간 데이터 공유 불가능
- ❌ **백업 어려움**: 수동 내보내기/가져오기만 가능
- ❌ **확장성 제한**: 대용량 데이터 처리 어려움
- ❌ **협업 불가**: 여러 사용자 간 데이터 공유 불가능

## 🌐 GitHub 환경에서 사용 가능한 데이터베이스 옵션

### 1. 🔥 **Supabase** (추천)

**장점:**
- ✅ **무료 티어**: 500MB 저장공간, 50,000 월간 활성 사용자
- ✅ **PostgreSQL 기반**: 강력한 관계형 데이터베이스
- ✅ **실시간 동기화**: 여러 기기 간 실시간 데이터 동기화
- ✅ **인증 시스템**: 사용자 로그인/회원가입 기능 내장
- ✅ **REST API**: 자동 생성되는 API 엔드포인트
- ✅ **GitHub 연동**: GitHub Pages와 완벽 호환

**가격:**
- 무료: 500MB DB, 50K MAU, 2GB 대역폭
- Pro ($25/월): 8GB DB, 100K MAU, 250GB 대역폭

### 2. 🔥 **Firebase** (Google)

**장점:**
- ✅ **무료 티어**: 1GB 저장공간, 50K 읽기/20K 쓰기
- ✅ **NoSQL 데이터베이스**: Firestore 사용
- ✅ **실시간 동기화**: 실시간 데이터베이스 지원
- ✅ **Google 생태계**: Google Analytics, AdSense 연동 용이
- ✅ **호스팅 포함**: Firebase Hosting 제공

**가격:**
- 무료: 1GB 저장, 50K 읽기/20K 쓰기
- Blaze (종량제): 사용량에 따른 과금

### 3. 🌟 **PlanetScale** (MySQL)

**장점:**
- ✅ **MySQL 기반**: 익숙한 SQL 문법
- ✅ **브랜치 기능**: 데이터베이스 스키마 버전 관리
- ✅ **확장성**: 대규모 트래픽 처리 가능

**단점:**
- ❌ **무료 티어 종료**: 2024년부터 유료 서비스만 제공
- ❌ **높은 비용**: 최소 $29/월부터 시작

### 4. 🐘 **Neon** (PostgreSQL)

**장점:**
- ✅ **무료 티어**: 0.5GB 저장공간
- ✅ **PostgreSQL 호환**: 표준 SQL 지원
- ✅ **서버리스**: 자동 스케일링

**가격:**
- 무료: 0.5GB 저장, 1개 프로젝트
- Pro ($19/월): 무제한 프로젝트, 더 많은 저장공간

## 🚀 **추천 마이그레이션 방안: Supabase**

### 왜 Supabase를 추천하는가?
1. **무료 티어가 관대함**: 500MB는 개인 프로젝트에 충분
2. **PostgreSQL의 강력함**: 복잡한 쿼리와 관계형 데이터 처리 가능
3. **개발자 친화적**: 직관적인 대시보드와 자동 API 생성
4. **GitHub Pages 호환**: 정적 사이트에서 바로 사용 가능
5. **실시간 기능**: 여러 기기 간 실시간 동기화

### 📋 마이그레이션 단계별 가이드

#### 1단계: Supabase 프로젝트 설정

```bash
# 1. Supabase 계정 생성
# https://supabase.com 에서 계정 생성

# 2. 새 프로젝트 생성
# - 프로젝트 이름: gongsoo-calendar
# - 데이터베이스 비밀번호 설정
# - 리전 선택: Northeast Asia (Seoul)
```

#### 2단계: 데이터베이스 스키마 설계

```sql
-- 사용자 테이블 (Supabase Auth 사용)
-- 자동으로 생성되는 auth.users 테이블 활용

-- 공수 데이터 테이블
CREATE TABLE work_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    work_days DECIMAL(3,1) DEFAULT 1.0,
    work_hours INTEGER DEFAULT 8,
    daily_rate INTEGER DEFAULT 150000,
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 설정 테이블
CREATE TABLE user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    default_daily_rate INTEGER DEFAULT 150000,
    default_hourly_rate INTEGER DEFAULT 18750,
    default_work_days DECIMAL(3,1) DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 광고 설정 테이블 (관리자용)
CREATE TABLE ad_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_type VARCHAR(50) NOT NULL, -- 'adsense', 'display', 'analytics'
    setting_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_work_records_user_date ON work_records(user_id, work_date);
CREATE INDEX idx_work_records_date ON work_records(work_date);
```

#### 3단계: 프론트엔드 코드 수정

```javascript
// supabase-client.js - 새 파일 생성
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseKey)

// 데이터 저장 함수 수정
export async function saveWorkData(workDate, workData) {
    const { data, error } = await supabase
        .from('work_records')
        .upsert({
            work_date: workDate,
            work_days: workData.workDays,
            work_hours: workData.workHours,
            daily_rate: workData.rate,
            memo: workData.memo
        })
    
    if (error) throw error
    return data
}

// 데이터 로드 함수 수정
export async function loadWorkData(startDate, endDate) {
    const { data, error } = await supabase
        .from('work_records')
        .select('*')
        .gte('work_date', startDate)
        .lte('work_date', endDate)
        .order('work_date')
    
    if (error) throw error
    return data
}

// 실시간 구독 설정
export function subscribeToWorkData(callback) {
    return supabase
        .channel('work_records')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'work_records'
        }, callback)
        .subscribe()
}
```

#### 4단계: 기존 localStorage 데이터 마이그레이션

```javascript
// migration.js - 데이터 마이그레이션 스크립트
export async function migrateLocalStorageToSupabase() {
    // 기존 localStorage 데이터 읽기
    const localData = localStorage.getItem('gongsooCalendarData')
    if (!localData) return
    
    const { workData, settings } = JSON.parse(localData)
    
    try {
        // 1. 사용자 설정 마이그레이션
        await supabase.from('user_settings').upsert({
            default_daily_rate: settings.defaultDailyRate,
            default_hourly_rate: settings.defaultHourlyRate,
            default_work_days: parseFloat(settings.defaultWorkDays)
        })
        
        // 2. 공수 데이터 마이그레이션
        const workRecords = Object.entries(workData).map(([date, data]) => ({
            work_date: date,
            work_days: parseFloat(data.workDays),
            work_hours: data.workHours,
            daily_rate: data.rate,
            memo: data.memo || ''
        }))
        
        if (workRecords.length > 0) {
            await supabase.from('work_records').insert(workRecords)
        }
        
        // 3. 마이그레이션 완료 후 localStorage 백업
        localStorage.setItem('gongsooCalendarData_backup', localData)
        
        console.log('✅ 데이터 마이그레이션 완료!')
        return true
        
    } catch (error) {
        console.error('❌ 마이그레이션 실패:', error)
        return false
    }
}
```

#### 5단계: 사용자 인증 추가

```javascript
// auth.js - 인증 관련 함수
export async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password
    })
    return { data, error }
}

export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    })
    return { data, error }
}

export async function signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
}

export function getCurrentUser() {
    return supabase.auth.getUser()
}

// 인증 상태 변경 감지
export function onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
}
```

## 📦 필요한 패키지 설치

```html
<!-- CDN 방식 (권장) -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- 또는 npm 방식 -->
<!-- npm install @supabase/supabase-js -->
```

## 🔧 환경 변수 설정

```javascript
// config.js
const SUPABASE_CONFIG = {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key'
}

// GitHub Pages에서 환경 변수 사용 시
// GitHub 저장소 Settings > Secrets and variables > Actions에서 설정
```

## 🚀 배포 및 테스트

### 1. GitHub Pages 배포
```bash
# 기존 github-uploader.html 사용하여 업로드
# 또는 GitHub Actions를 통한 자동 배포 설정
```

### 2. 테스트 체크리스트
- [ ] 사용자 회원가입/로그인 기능
- [ ] 공수 데이터 저장/로드 기능
- [ ] 실시간 동기화 테스트
- [ ] 여러 기기에서 동일 계정 접속 테스트
- [ ] 데이터 마이그레이션 테스트

## 💰 비용 예상

### 무료 티어로 충분한 경우
- 개인 사용자 (월 활성 사용자 < 50K)
- 데이터 크기 < 500MB
- 대역폭 < 2GB/월

### 유료 전환이 필요한 경우
- **Pro 플랜 ($25/월)**:
  - 8GB 데이터베이스
  - 100K 월간 활성 사용자
  - 250GB 대역폭
  - 백업 및 복원 기능

## 🔄 대안 방안

### 하이브리드 접근법
1. **중요 데이터**: Supabase에 저장 (공수 데이터, 사용자 설정)
2. **임시 데이터**: localStorage 유지 (UI 상태, 캐시)
3. **오프라인 지원**: Service Worker + IndexedDB 활용

### 점진적 마이그레이션
1. **1단계**: 새 사용자만 Supabase 사용
2. **2단계**: 기존 사용자에게 마이그레이션 옵션 제공
3. **3단계**: localStorage 백업 유지하며 완전 전환

## 📞 지원 및 문의

- **Supabase 문서**: https://supabase.com/docs
- **커뮤니티 포럼**: https://github.com/supabase/supabase/discussions
- **Discord**: https://discord.supabase.com

---

**결론**: 현재 프로젝트는 Supabase로 마이그레이션하는 것이 가장 적합합니다. 무료 티어가 관대하고, PostgreSQL의 강력함을 활용할 수 있으며, GitHub Pages와의 호환성이 뛰어납니다. 점진적 마이그레이션을 통해 기존 사용자의 데이터 손실 없이 안전하게 전환할 수 있습니다.