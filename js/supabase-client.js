/**
 * Supabase 클라이언트 설정 및 데이터베이스 연동 함수
 * 공수달력 프로젝트용 데이터베이스 연결 모듈
 */

// Supabase 설정 (실제 사용 시 본인의 프로젝트 정보로 변경 필요)
const SUPABASE_CONFIG = {
    url: 'YOUR_SUPABASE_URL', // 예: https://your-project.supabase.co
    anonKey: 'YOUR_SUPABASE_ANON_KEY' // Supabase 프로젝트의 anon public key
};

// Supabase 클라이언트 초기화
let supabase = null;

// Supabase 초기화 함수
function initSupabase(url, key) {
    if (typeof window.supabase === 'undefined') {
        console.error('❌ Supabase 라이브러리가 로드되지 않았습니다. HTML에 다음 스크립트를 추가하세요:');
        console.error('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
        return null;
    }
    
    supabase = window.supabase.createClient(url, key);
    console.log('✅ Supabase 클라이언트 초기화 완료');
    return supabase;
}

// 설정 확인 및 초기화
function checkSupabaseConfig() {
    if (SUPABASE_CONFIG.url === 'YOUR_SUPABASE_URL' || SUPABASE_CONFIG.anonKey === 'YOUR_SUPABASE_ANON_KEY') {
        console.warn('⚠️ Supabase 설정이 필요합니다. SUPABASE_CONFIG 객체의 url과 anonKey를 설정하세요.');
        return false;
    }
    return true;
}

// 자동 초기화
if (checkSupabaseConfig()) {
    initSupabase(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
}

// =============================================================================
// 인증 관련 함수들
// =============================================================================

/**
 * 사용자 회원가입
 * @param {string} email - 이메일 주소
 * @param {string} password - 비밀번호
 * @returns {Promise<{data: any, error: any}>}
 */
async function signUp(email, password) {
    if (!supabase) {
        return { data: null, error: { message: 'Supabase가 초기화되지 않았습니다.' } };
    }
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });
        
        if (error) {
            console.error('❌ 회원가입 실패:', error.message);
        } else {
            console.log('✅ 회원가입 성공:', data.user?.email);
        }
        
        return { data, error };
    } catch (err) {
        console.error('❌ 회원가입 오류:', err);
        return { data: null, error: err };
    }
}

/**
 * 사용자 로그인
 * @param {string} email - 이메일 주소
 * @param {string} password - 비밀번호
 * @returns {Promise<{data: any, error: any}>}
 */
async function signIn(email, password) {
    if (!supabase) {
        return { data: null, error: { message: 'Supabase가 초기화되지 않았습니다.' } };
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            console.error('❌ 로그인 실패:', error.message);
        } else {
            console.log('✅ 로그인 성공:', data.user?.email);
            // 로그인 성공 시 사용자 설정 초기화
            await initializeUserSettings();
        }
        
        return { data, error };
    } catch (err) {
        console.error('❌ 로그인 오류:', err);
        return { data: null, error: err };
    }
}

/**
 * 사용자 로그아웃
 * @returns {Promise<{error: any}>}
 */
async function signOut() {
    if (!supabase) {
        return { error: { message: 'Supabase가 초기화되지 않았습니다.' } };
    }
    
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            console.error('❌ 로그아웃 실패:', error.message);
        } else {
            console.log('✅ 로그아웃 성공');
        }
        
        return { error };
    } catch (err) {
        console.error('❌ 로그아웃 오류:', err);
        return { error: err };
    }
}

/**
 * 현재 로그인된 사용자 정보 가져오기
 * @returns {Promise<{data: any, error: any}>}
 */
async function getCurrentUser() {
    if (!supabase) {
        return { data: null, error: { message: 'Supabase가 초기화되지 않았습니다.' } };
    }
    
    try {
        const { data, error } = await supabase.auth.getUser();
        return { data, error };
    } catch (err) {
        console.error('❌ 사용자 정보 조회 오류:', err);
        return { data: null, error: err };
    }
}

/**
 * 인증 상태 변경 감지
 * @param {function} callback - 상태 변경 시 호출될 콜백 함수
 * @returns {object} 구독 객체
 */
function onAuthStateChange(callback) {
    if (!supabase) {
        console.error('❌ Supabase가 초기화되지 않았습니다.');
        return null;
    }
    
    return supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔄 인증 상태 변경:', event, session?.user?.email);
        callback(event, session);
    });
}

// =============================================================================
// 공수 데이터 관련 함수들
// =============================================================================

/**
 * 공수 데이터 저장/업데이트
 * @param {string} workDate - 작업 날짜 (YYYY-MM-DD 형식)
 * @param {object} workData - 공수 데이터 객체
 * @returns {Promise<{data: any, error: any}>}
 */
async function saveWorkData(workDate, workData) {
    if (!supabase) {
        return { data: null, error: { message: 'Supabase가 초기화되지 않았습니다.' } };
    }
    
    try {
        const { data: userData } = await getCurrentUser();
        if (!userData.user) {
            return { data: null, error: { message: '로그인이 필요합니다.' } };
        }
        
        const { data, error } = await supabase
            .from('work_records')
            .upsert({
                user_id: userData.user.id,
                work_date: workDate,
                work_days: parseFloat(workData.workDays) || 1.0,
                work_hours: parseInt(workData.workHours) || 8,
                daily_rate: parseInt(workData.rate) || 150000,
                memo: workData.memo || '',
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,work_date'
            })
            .select();
        
        if (error) {
            console.error('❌ 공수 데이터 저장 실패:', error.message);
        } else {
            console.log('✅ 공수 데이터 저장 성공:', workDate);
        }
        
        return { data, error };
    } catch (err) {
        console.error('❌ 공수 데이터 저장 오류:', err);
        return { data: null, error: err };
    }
}

/**
 * 공수 데이터 로드 (날짜 범위)
 * @param {string} startDate - 시작 날짜 (YYYY-MM-DD)
 * @param {string} endDate - 종료 날짜 (YYYY-MM-DD)
 * @returns {Promise<{data: any, error: any}>}
 */
async function loadWorkData(startDate, endDate) {
    if (!supabase) {
        return { data: null, error: { message: 'Supabase가 초기화되지 않았습니다.' } };
    }
    
    try {
        const { data: userData } = await getCurrentUser();
        if (!userData.user) {
            return { data: null, error: { message: '로그인이 필요합니다.' } };
        }
        
        const { data, error } = await supabase
            .from('work_records')
            .select('*')
            .eq('user_id', userData.user.id)
            .gte('work_date', startDate)
            .lte('work_date', endDate)
            .order('work_date', { ascending: true });
        
        if (error) {
            console.error('❌ 공수 데이터 로드 실패:', error.message);
        } else {
            console.log(`✅ 공수 데이터 로드 성공: ${data.length}건`);
        }
        
        return { data, error };
    } catch (err) {
        console.error('❌ 공수 데이터 로드 오류:', err);
        return { data: null, error: err };
    }
}

/**
 * 특정 날짜의 공수 데이터 삭제
 * @param {string} workDate - 삭제할 날짜 (YYYY-MM-DD)
 * @returns {Promise<{data: any, error: any}>}
 */
async function deleteWorkData(workDate) {
    if (!supabase) {
        return { data: null, error: { message: 'Supabase가 초기화되지 않았습니다.' } };
    }
    
    try {
        const { data: userData } = await getCurrentUser();
        if (!userData.user) {
            return { data: null, error: { message: '로그인이 필요합니다.' } };
        }
        
        const { data, error } = await supabase
            .from('work_records')
            .delete()
            .eq('user_id', userData.user.id)
            .eq('work_date', workDate)
            .select();
        
        if (error) {
            console.error('❌ 공수 데이터 삭제 실패:', error.message);
        } else {
            console.log('✅ 공수 데이터 삭제 성공:', workDate);
        }
        
        return { data, error };
    } catch (err) {
        console.error('❌ 공수 데이터 삭제 오류:', err);
        return { data: null, error: err };
    }
}

// =============================================================================
// 사용자 설정 관련 함수들
// =============================================================================

/**
 * 사용자 설정 초기화 (로그인 시 자동 호출)
 */
async function initializeUserSettings() {
    if (!supabase) return;
    
    try {
        const { data: userData } = await getCurrentUser();
        if (!userData.user) return;
        
        // 기존 설정 확인
        const { data: existingSettings } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userData.user.id)
            .single();
        
        // 설정이 없으면 기본값으로 생성
        if (!existingSettings) {
            await supabase
                .from('user_settings')
                .insert({
                    user_id: userData.user.id,
                    default_daily_rate: 150000,
                    default_hourly_rate: 18750,
                    default_work_days: 1.0
                });
            console.log('✅ 사용자 설정 초기화 완료');
        }
    } catch (err) {
        console.error('❌ 사용자 설정 초기화 오류:', err);
    }
}

/**
 * 사용자 설정 저장
 * @param {object} settings - 설정 객체
 * @returns {Promise<{data: any, error: any}>}
 */
async function saveUserSettings(settings) {
    if (!supabase) {
        return { data: null, error: { message: 'Supabase가 초기화되지 않았습니다.' } };
    }
    
    try {
        const { data: userData } = await getCurrentUser();
        if (!userData.user) {
            return { data: null, error: { message: '로그인이 필요합니다.' } };
        }
        
        const { data, error } = await supabase
            .from('user_settings')
            .upsert({
                user_id: userData.user.id,
                default_daily_rate: parseInt(settings.defaultDailyRate) || 150000,
                default_hourly_rate: parseInt(settings.defaultHourlyRate) || 18750,
                default_work_days: parseFloat(settings.defaultWorkDays) || 1.0,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            })
            .select();
        
        if (error) {
            console.error('❌ 사용자 설정 저장 실패:', error.message);
        } else {
            console.log('✅ 사용자 설정 저장 성공');
        }
        
        return { data, error };
    } catch (err) {
        console.error('❌ 사용자 설정 저장 오류:', err);
        return { data: null, error: err };
    }
}

/**
 * 사용자 설정 로드
 * @returns {Promise<{data: any, error: any}>}
 */
async function loadUserSettings() {
    if (!supabase) {
        return { data: null, error: { message: 'Supabase가 초기화되지 않았습니다.' } };
    }
    
    try {
        const { data: userData } = await getCurrentUser();
        if (!userData.user) {
            return { data: null, error: { message: '로그인이 필요합니다.' } };
        }
        
        const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userData.user.id)
            .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
            console.error('❌ 사용자 설정 로드 실패:', error.message);
        } else if (data) {
            console.log('✅ 사용자 설정 로드 성공');
        }
        
        return { data, error };
    } catch (err) {
        console.error('❌ 사용자 설정 로드 오류:', err);
        return { data: null, error: err };
    }
}

// =============================================================================
// 실시간 구독 관련 함수들
// =============================================================================

/**
 * 공수 데이터 실시간 구독
 * @param {function} callback - 데이터 변경 시 호출될 콜백 함수
 * @returns {object} 구독 객체
 */
function subscribeToWorkData(callback) {
    if (!supabase) {
        console.error('❌ Supabase가 초기화되지 않았습니다.');
        return null;
    }
    
    return supabase
        .channel('work_records_changes')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'work_records'
        }, (payload) => {
            console.log('🔄 공수 데이터 실시간 변경:', payload);
            callback(payload);
        })
        .subscribe();
}

/**
 * 구독 해제
 * @param {object} subscription - 구독 객체
 */
function unsubscribe(subscription) {
    if (subscription && supabase) {
        supabase.removeChannel(subscription);
        console.log('✅ 실시간 구독 해제 완료');
    }
}

// =============================================================================
// 데이터 마이그레이션 함수들
// =============================================================================

/**
 * localStorage에서 Supabase로 데이터 마이그레이션
 * @returns {Promise<boolean>} 마이그레이션 성공 여부
 */
async function migrateLocalStorageToSupabase() {
    if (!supabase) {
        console.error('❌ Supabase가 초기화되지 않았습니다.');
        return false;
    }
    
    // 로그인 확인
    const { data: userData } = await getCurrentUser();
    if (!userData.user) {
        console.error('❌ 마이그레이션을 위해 로그인이 필요합니다.');
        return false;
    }
    
    try {
        // 기존 localStorage 데이터 읽기
        const localData = localStorage.getItem('gongsooCalendarData');
        if (!localData) {
            console.log('ℹ️ 마이그레이션할 localStorage 데이터가 없습니다.');
            return true;
        }
        
        const { workData, settings } = JSON.parse(localData);
        console.log('📦 localStorage 데이터 발견:', Object.keys(workData).length + '건의 공수 데이터');
        
        // 1. 사용자 설정 마이그레이션
        if (settings) {
            await saveUserSettings({
                defaultDailyRate: settings.defaultDailyRate || 150000,
                defaultHourlyRate: settings.defaultHourlyRate || 18750,
                defaultWorkDays: settings.defaultWorkDays || '1.0'
            });
            console.log('✅ 사용자 설정 마이그레이션 완료');
        }
        
        // 2. 공수 데이터 마이그레이션
        if (workData && Object.keys(workData).length > 0) {
            let successCount = 0;
            let errorCount = 0;
            
            for (const [date, data] of Object.entries(workData)) {
                const result = await saveWorkData(date, {
                    workDays: data.workDays || '1.0',
                    workHours: data.workHours || 8,
                    rate: data.rate || 150000,
                    memo: data.memo || ''
                });
                
                if (result.error) {
                    errorCount++;
                    console.error(`❌ ${date} 데이터 마이그레이션 실패:`, result.error.message);
                } else {
                    successCount++;
                }
            }
            
            console.log(`✅ 공수 데이터 마이그레이션 완료: 성공 ${successCount}건, 실패 ${errorCount}건`);
        }
        
        // 3. 마이그레이션 완료 후 localStorage 백업
        const backupKey = `gongsooCalendarData_backup_${new Date().toISOString().split('T')[0]}`;
        localStorage.setItem(backupKey, localData);
        console.log(`💾 기존 데이터를 ${backupKey}로 백업했습니다.`);
        
        console.log('🎉 데이터 마이그레이션이 완료되었습니다!');
        return true;
        
    } catch (error) {
        console.error('❌ 마이그레이션 실패:', error);
        return false;
    }
}

// =============================================================================
// 유틸리티 함수들
// =============================================================================

/**
 * Supabase 연결 상태 확인
 * @returns {boolean} 연결 상태
 */
function isSupabaseConnected() {
    return supabase !== null && checkSupabaseConfig();
}

/**
 * 데이터베이스 연결 테스트
 * @returns {Promise<boolean>} 연결 테스트 결과
 */
async function testDatabaseConnection() {
    if (!supabase) {
        console.error('❌ Supabase가 초기화되지 않았습니다.');
        return false;
    }
    
    try {
        // 간단한 쿼리로 연결 테스트
        const { data, error } = await supabase
            .from('work_records')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('❌ 데이터베이스 연결 테스트 실패:', error.message);
            return false;
        }
        
        console.log('✅ 데이터베이스 연결 테스트 성공');
        return true;
    } catch (err) {
        console.error('❌ 데이터베이스 연결 테스트 오류:', err);
        return false;
    }
}

// 전역 객체로 내보내기 (브라우저 환경)
if (typeof window !== 'undefined') {
    window.SupabaseClient = {
        // 설정
        initSupabase,
        isSupabaseConnected,
        testDatabaseConnection,
        
        // 인증
        signUp,
        signIn,
        signOut,
        getCurrentUser,
        onAuthStateChange,
        
        // 공수 데이터
        saveWorkData,
        loadWorkData,
        deleteWorkData,
        
        // 사용자 설정
        saveUserSettings,
        loadUserSettings,
        
        // 실시간 구독
        subscribeToWorkData,
        unsubscribe,
        
        // 마이그레이션
        migrateLocalStorageToSupabase
    };
}

// 모듈 내보내기 (Node.js 환경)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initSupabase,
        isSupabaseConnected,
        testDatabaseConnection,
        signUp,
        signIn,
        signOut,
        getCurrentUser,
        onAuthStateChange,
        saveWorkData,
        loadWorkData,
        deleteWorkData,
        saveUserSettings,
        loadUserSettings,
        subscribeToWorkData,
        unsubscribe,
        migrateLocalStorageToSupabase
    };
}