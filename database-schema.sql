-- =====================================================================
-- 공수달력 프로젝트 - Supabase 데이터베이스 스키마
-- =====================================================================
-- 이 파일을 Supabase SQL Editor에서 실행하여 데이터베이스 구조를 생성하세요.
-- Supabase 대시보드 > SQL Editor > New query에서 아래 코드를 복사하여 실행

-- =====================================================================
-- 1. 공수 기록 테이블 (work_records)
-- =====================================================================
CREATE TABLE IF NOT EXISTS work_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    work_date DATE NOT NULL,
    work_days DECIMAL(3,1) DEFAULT 1.0 CHECK (work_days >= 0 AND work_days <= 1.0),
    work_hours INTEGER DEFAULT 8 CHECK (work_hours >= 0 AND work_hours <= 24),
    daily_rate INTEGER DEFAULT 150000 CHECK (daily_rate >= 0),
    memo TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 복합 유니크 제약조건: 한 사용자가 같은 날짜에 중복 기록 방지
    UNIQUE(user_id, work_date)
);

-- 공수 기록 테이블 코멘트
COMMENT ON TABLE work_records IS '사용자별 일일 공수 기록 테이블';
COMMENT ON COLUMN work_records.work_days IS '근무일수 (0.0 ~ 1.0, 0.5 = 반일)';
COMMENT ON COLUMN work_records.work_hours IS '근무시간 (시간 단위)';
COMMENT ON COLUMN work_records.daily_rate IS '일당 (원 단위)';
COMMENT ON COLUMN work_records.memo IS '메모 (선택사항)';

-- =====================================================================
-- 2. 사용자 설정 테이블 (user_settings)
-- =====================================================================
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    default_daily_rate INTEGER DEFAULT 150000 CHECK (default_daily_rate >= 0),
    default_hourly_rate INTEGER DEFAULT 18750 CHECK (default_hourly_rate >= 0),
    default_work_days DECIMAL(3,1) DEFAULT 1.0 CHECK (default_work_days >= 0 AND default_work_days <= 1.0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 설정 테이블 코멘트
COMMENT ON TABLE user_settings IS '사용자별 기본 설정 테이블';
COMMENT ON COLUMN user_settings.default_daily_rate IS '기본 일당 설정 (원 단위)';
COMMENT ON COLUMN user_settings.default_hourly_rate IS '기본 시급 설정 (원 단위)';
COMMENT ON COLUMN user_settings.default_work_days IS '기본 근무일수 설정 (0.0 ~ 1.0)';

-- =====================================================================
-- 3. 광고 설정 테이블 (ad_settings) - 관리자용
-- =====================================================================
CREATE TABLE IF NOT EXISTS ad_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_type VARCHAR(50) NOT NULL CHECK (setting_type IN ('adsense', 'display', 'analytics', 'general')),
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 복합 유니크 제약조건: 같은 타입과 키의 중복 방지
    UNIQUE(setting_type, setting_key)
);

-- 광고 설정 테이블 코멘트
COMMENT ON TABLE ad_settings IS '광고 관련 설정 테이블 (관리자용)';
COMMENT ON COLUMN ad_settings.setting_type IS '설정 타입 (adsense, display, analytics, general)';
COMMENT ON COLUMN ad_settings.setting_key IS '설정 키 (예: client_id, slot_id)';
COMMENT ON COLUMN ad_settings.setting_value IS '설정 값 (JSON 형태)';
COMMENT ON COLUMN ad_settings.is_active IS '활성화 상태';

-- =====================================================================
-- 4. 인덱스 생성
-- =====================================================================

-- 공수 기록 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_work_records_user_id ON work_records(user_id);
CREATE INDEX IF NOT EXISTS idx_work_records_work_date ON work_records(work_date);
CREATE INDEX IF NOT EXISTS idx_work_records_user_date ON work_records(user_id, work_date);
CREATE INDEX IF NOT EXISTS idx_work_records_created_at ON work_records(created_at);

-- 사용자 설정 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- 광고 설정 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_ad_settings_type ON ad_settings(setting_type);
CREATE INDEX IF NOT EXISTS idx_ad_settings_active ON ad_settings(is_active);

-- =====================================================================
-- 5. RLS (Row Level Security) 정책 설정
-- =====================================================================

-- 공수 기록 테이블 RLS 활성화
ALTER TABLE work_records ENABLE ROW LEVEL SECURITY;

-- 공수 기록 정책: 사용자는 자신의 데이터만 접근 가능
CREATE POLICY "Users can view own work records" ON work_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own work records" ON work_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own work records" ON work_records
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own work records" ON work_records
    FOR DELETE USING (auth.uid() = user_id);

-- 사용자 설정 테이블 RLS 활성화
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 사용자 설정 정책: 사용자는 자신의 설정만 접근 가능
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" ON user_settings
    FOR DELETE USING (auth.uid() = user_id);

-- 광고 설정 테이블 RLS 활성화 (관리자만 접근)
ALTER TABLE ad_settings ENABLE ROW LEVEL SECURITY;

-- 광고 설정 정책: 인증된 사용자만 읽기 가능 (관리자 기능은 별도 구현)
CREATE POLICY "Authenticated users can view ad settings" ON ad_settings
    FOR SELECT USING (auth.role() = 'authenticated');

-- 관리자만 광고 설정 수정 가능 (이메일 기반 관리자 확인)
-- 실제 사용 시 admin@yourdomain.com을 실제 관리자 이메일로 변경하세요
CREATE POLICY "Admin can manage ad settings" ON ad_settings
    FOR ALL USING (
        auth.jwt() ->> 'email' = 'admin@yourdomain.com'
    );

-- =====================================================================
-- 6. 트리거 함수 생성 (updated_at 자동 업데이트)
-- =====================================================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 공수 기록 테이블 트리거
CREATE TRIGGER update_work_records_updated_at
    BEFORE UPDATE ON work_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 사용자 설정 테이블 트리거
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 광고 설정 테이블 트리거
CREATE TRIGGER update_ad_settings_updated_at
    BEFORE UPDATE ON ad_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- 7. 기본 데이터 삽입 (선택사항)
-- =====================================================================

-- 기본 광고 설정 데이터 삽입
INSERT INTO ad_settings (setting_type, setting_key, setting_value, is_active) VALUES
('adsense', 'client_id', '{"value": "ca-pub-xxxxxxxxxx", "description": "Google AdSense 클라이언트 ID"}', false),
('adsense', 'auto_ads', '{"enabled": false, "description": "자동 광고 활성화 여부"}', false),
('display', 'banner_top', '{"enabled": false, "slot_id": "", "size": "728x90", "description": "상단 배너 광고"}', false),
('display', 'banner_bottom', '{"enabled": false, "slot_id": "", "size": "728x90", "description": "하단 배너 광고"}', false),
('display', 'sidebar', '{"enabled": false, "slot_id": "", "size": "300x250", "description": "사이드바 광고"}', false),
('analytics', 'google_analytics', '{"tracking_id": "", "enabled": false, "description": "Google Analytics 추적 ID"}', false),
('general', 'ad_frequency', '{"value": 3, "description": "광고 표시 빈도 (페이지 방문 횟수)"}', true)
ON CONFLICT (setting_type, setting_key) DO NOTHING;

-- =====================================================================
-- 8. 유용한 뷰 생성 (선택사항)
-- =====================================================================

-- 월별 공수 통계 뷰
CREATE OR REPLACE VIEW monthly_work_stats AS
SELECT 
    user_id,
    DATE_TRUNC('month', work_date) as month,
    COUNT(*) as work_days_count,
    SUM(work_days) as total_work_days,
    SUM(work_hours) as total_work_hours,
    SUM(work_days * daily_rate) as total_earnings,
    AVG(daily_rate) as avg_daily_rate,
    MIN(work_date) as first_work_date,
    MAX(work_date) as last_work_date
FROM work_records
GROUP BY user_id, DATE_TRUNC('month', work_date)
ORDER BY user_id, month DESC;

-- 뷰 코멘트
COMMENT ON VIEW monthly_work_stats IS '사용자별 월간 공수 통계 뷰';

-- 연간 공수 통계 뷰
CREATE OR REPLACE VIEW yearly_work_stats AS
SELECT 
    user_id,
    DATE_TRUNC('year', work_date) as year,
    COUNT(*) as work_days_count,
    SUM(work_days) as total_work_days,
    SUM(work_hours) as total_work_hours,
    SUM(work_days * daily_rate) as total_earnings,
    AVG(daily_rate) as avg_daily_rate,
    MIN(work_date) as first_work_date,
    MAX(work_date) as last_work_date
FROM work_records
GROUP BY user_id, DATE_TRUNC('year', work_date)
ORDER BY user_id, year DESC;

-- 뷰 코멘트
COMMENT ON VIEW yearly_work_stats IS '사용자별 연간 공수 통계 뷰';

-- =====================================================================
-- 9. 데이터베이스 함수 생성 (선택사항)
-- =====================================================================

-- 특정 기간의 총 수익 계산 함수
CREATE OR REPLACE FUNCTION calculate_earnings(
    p_user_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE(
    total_work_days DECIMAL,
    total_work_hours BIGINT,
    total_earnings BIGINT,
    avg_daily_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(wr.work_days), 0) as total_work_days,
        COALESCE(SUM(wr.work_hours), 0) as total_work_hours,
        COALESCE(SUM(wr.work_days * wr.daily_rate), 0) as total_earnings,
        COALESCE(AVG(wr.daily_rate), 0) as avg_daily_rate
    FROM work_records wr
    WHERE wr.user_id = p_user_id
      AND wr.work_date >= p_start_date
      AND wr.work_date <= p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수 코멘트
COMMENT ON FUNCTION calculate_earnings IS '특정 사용자의 기간별 수익 계산 함수';

-- =====================================================================
-- 10. 실행 완료 메시지
-- =====================================================================

-- 스키마 생성 완료 확인
DO $$
BEGIN
    RAISE NOTICE '✅ 공수달력 데이터베이스 스키마 생성이 완료되었습니다!';
    RAISE NOTICE '📋 생성된 테이블:';
    RAISE NOTICE '   - work_records (공수 기록)';
    RAISE NOTICE '   - user_settings (사용자 설정)';
    RAISE NOTICE '   - ad_settings (광고 설정)';
    RAISE NOTICE '🔒 RLS 정책이 활성화되었습니다.';
    RAISE NOTICE '📊 통계 뷰가 생성되었습니다.';
    RAISE NOTICE '⚡ 트리거와 함수가 설정되었습니다.';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 이제 프론트엔드에서 Supabase 클라이언트를 사용할 수 있습니다!';
    RAISE NOTICE '📝 다음 단계:';
    RAISE NOTICE '   1. Supabase 프로젝트 URL과 API 키를 supabase-client.js에 설정';
    RAISE NOTICE '   2. HTML 파일에 Supabase 라이브러리 추가';
    RAISE NOTICE '   3. 기존 localStorage 데이터 마이그레이션 실행';
END $$;

-- =====================================================================
-- 추가 정보
-- =====================================================================
/*

🔧 설정 방법:

1. Supabase 대시보드에서 이 SQL을 실행하세요.
2. supabase-client.js 파일에서 다음 정보를 업데이트하세요:
   - SUPABASE_CONFIG.url: 프로젝트 URL
   - SUPABASE_CONFIG.anonKey: anon public key

3. HTML 파일에 Supabase 라이브러리를 추가하세요:
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

4. 관리자 이메일을 변경하세요:
   - 위의 RLS 정책에서 'admin@yourdomain.com'을 실제 관리자 이메일로 변경

📊 테이블 구조:

- work_records: 사용자별 일일 공수 기록
- user_settings: 사용자별 기본 설정 (일당, 시급 등)
- ad_settings: 광고 관련 설정 (관리자용)

🔒 보안:

- RLS(Row Level Security)가 활성화되어 사용자는 자신의 데이터만 접근 가능
- 광고 설정은 관리자만 수정 가능
- 모든 테이블에 적절한 제약조건과 인덱스 설정

📈 기능:

- 자동 updated_at 업데이트
- 월별/연간 통계 뷰
- 수익 계산 함수
- 실시간 구독 지원

*/