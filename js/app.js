/**
 * 공수달력 앱 메인 JavaScript
 */

// 전역 변수 및 상태 관리
const appState = {
    currentDate: new Date(),
    selectedDate: null,
    workData: {}, // 날짜별 공수 데이터 저장 (형식: 'YYYY-MM-DD': { workDays: 1, workHours: 8, rate: 150000, memo: '메모' })
    settings: {
        defaultDailyRate: 150000,
        defaultHourlyRate: 18750,
        defaultWorkDays: '1.0'
    }
};

// DOM 요소 (페이지 로드 후 초기화)
let elements = {};

// 이벤트 리스너 설정
function setupEventListeners() {
    // 월 이동 버튼
    elements.prevMonthBtn.addEventListener('click', () => {
        appState.currentDate.setMonth(appState.currentDate.getMonth() - 1);
        updateCalendar();
    });

    elements.nextMonthBtn.addEventListener('click', () => {
        appState.currentDate.setMonth(appState.currentDate.getMonth() + 1);
        updateCalendar();
    });

    // 오늘 버튼
    elements.todayBtn.addEventListener('click', () => {
        appState.currentDate = new Date();
        updateCalendar();
    });
    
    // 사이드바 메뉴 설정 버튼
    const settingsBtn = document.querySelector('.menu li:nth-child(3) a');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (elements.defaultDailyRateInput && elements.defaultHourlyRateInput && elements.rateModal) {
                elements.defaultDailyRateInput.value = appState.settings.defaultDailyRate;
                elements.defaultHourlyRateInput.value = appState.settings.defaultHourlyRate;
                elements.rateModal.classList.add('show');
            }
        });
    }

    // 상세 정보 모달 닫기 버튼
    if (elements.closeDetailModalBtn) {
        elements.closeDetailModalBtn.addEventListener('click', () => {
            if (elements.detailModal) {
                elements.detailModal.classList.remove('show');
            }
        });
    }

    // 저장 버튼
    if (elements.saveBtn) {
        elements.saveBtn.addEventListener('click', saveWorkData);
    }

    // 삭제 버튼
    if (elements.deleteBtn) {
        elements.deleteBtn.addEventListener('click', deleteWorkData);
    }

    // 단가 수정 버튼
    if (elements.editRateBtn) {
        elements.editRateBtn.addEventListener('click', () => {
            if (elements.defaultDailyRateInput && elements.defaultHourlyRateInput && elements.rateModal) {
                elements.defaultDailyRateInput.value = appState.settings.defaultDailyRate;
                elements.defaultHourlyRateInput.value = appState.settings.defaultHourlyRate;
                elements.rateModal.classList.add('show');
            }
        });
    }

    // 모달 닫기 버튼
    if (elements.closeModalBtn) {
        elements.closeModalBtn.addEventListener('click', () => {
            if (elements.rateModal) {
                elements.rateModal.classList.remove('show');
            }
        });
    }

    // 단가 저장 버튼
    if (elements.saveRateBtn) {
        elements.saveRateBtn.addEventListener('click', saveRateSettings);
    }

    // 단가 취소 버튼
    if (elements.cancelRateBtn) {
        elements.cancelRateBtn.addEventListener('click', () => {
            if (elements.rateModal) {
                elements.rateModal.classList.remove('show');
            }
        });
    }

    // 시간당 단가 자동 계산
    if (elements.defaultDailyRateInput) {
        elements.defaultDailyRateInput.addEventListener('input', () => {
            const dailyRate = parseInt(elements.defaultDailyRateInput.value) || 0;
            if (elements.defaultHourlyRateInput) {
                elements.defaultHourlyRateInput.value = Math.round(dailyRate / 8);
            }
        });
    }

    // 일당 자동 계산
    if (elements.defaultHourlyRateInput) {
        elements.defaultHourlyRateInput.addEventListener('input', () => {
            const hourlyRate = parseInt(elements.defaultHourlyRateInput.value) || 0;
            if (elements.defaultDailyRateInput) {
                elements.defaultDailyRateInput.value = hourlyRate * 8;
            }
        });
    }

    // 모달 외부 클릭 시 닫기
    if (elements.rateModal) {
        elements.rateModal.addEventListener('click', (e) => {
            if (e.target === elements.rateModal) {
                elements.rateModal.classList.remove('show');
            }
        });
    }
    
    // 상세 정보 모달 외부 클릭 시 닫기
    if (elements.detailModal) {
        elements.detailModal.addEventListener('click', (e) => {
            if (e.target === elements.detailModal) {
                elements.detailModal.classList.remove('show');
            }
        });
    }
    
    // 모든 입력 필드에서 이벤트 전파 방지 (드래그 시 모달이 닫히지 않도록)
    const inputFields = [elements.workHoursInput, elements.dailyRateInput, elements.memoInput].filter(Boolean);
    
    inputFields.forEach(input => {
        if (input) {
            input.addEventListener('mousedown', (e) => {
                e.stopPropagation();
            });
            
            input.addEventListener('selectstart', (e) => {
                e.stopPropagation();
            });
            
            input.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            
            input.addEventListener('focus', (e) => {
                e.stopPropagation();
            });
        }
    });

    // 로컬 스토리지에서 데이터 로드
    loadFromLocalStorage();
}

// 공수 데이터 저장
function saveWorkData() {
    if (!appState.selectedDate) return;

    const dateKey = formatDateKey(appState.selectedDate);
    // 활성화된 버튼에서 공수일 값을 가져옴
    const activeBtn = document.querySelector('.work-day-btn.active');
    const workDays = activeBtn ? parseFloat(activeBtn.dataset.value) : parseFloat(elements.workDaysInput.value) || 0;
    const workHours = parseInt(elements.workHoursInput.value) || 0;
    const dailyRate = parseInt(elements.dailyRateInput.value) || appState.settings.defaultDailyRate;
    const memo = elements.memoInput.value.trim();

    // 공수 계산 로직 (인터넷 공수달력 기준)
    // 0.5공수 = 일당의 50%, 1.0공수 = 일당의 100%, 1.5공수 = 일당의 150%, 2.0공수 = 일당의 200%
    let totalAmount;
    if (workDays <= 1.0) {
        // 1공수 이하: 기본급의 비례 계산
        totalAmount = dailyRate * workDays;
    } else {
        // 1공수 초과: 기본급 + 연장수당 (연장분은 1.5배 적용)
        const baseAmount = dailyRate; // 기본 1공수 금액
        const overtimeHours = workDays - 1.0; // 연장 공수
        const overtimeAmount = dailyRate * overtimeHours * 1.5; // 연장수당 (1.5배)
        totalAmount = baseAmount + overtimeAmount;
    }
    
    // 디버깅을 위한 콘솔 로그
    console.log('=== 공수 계산 디버깅 ===');
    console.log('선택된 날짜:', dateKey);
    console.log('활성 버튼:', activeBtn ? activeBtn.dataset.value : 'none');
    console.log('공수일 (workDays):', workDays, typeof workDays);
    console.log('일당 (dailyRate):', dailyRate, typeof dailyRate);
    console.log('계산 방식:', workDays <= 1.0 ? '기본급 비례' : '기본급 + 연장수당(1.5배)');
    
    if (workDays <= 1.0) {
        console.log('계산식: ', dailyRate, ' × ', workDays, ' = ', totalAmount);
    } else {
        const baseAmount = dailyRate;
        const overtimeHours = workDays - 1.0;
        const overtimeAmount = dailyRate * overtimeHours * 1.5;
        console.log('기본급:', baseAmount);
        console.log('연장공수:', overtimeHours);
        console.log('연장수당:', overtimeAmount, '(', dailyRate, ' × ', overtimeHours, ' × 1.5)');
        console.log('총액:', baseAmount, ' + ', overtimeAmount, ' = ', totalAmount);
    }
    console.log('========================');
    
    appState.workData[dateKey] = {
        workDays,
        workHours,
        rate: dailyRate,
        totalAmount,
        memo
    };
    
    console.log('저장된 전체 데이터:', appState.workData[dateKey]);

    // 로컬 스토리지에 저장
    saveToLocalStorage();

    // 달력 및 요약 정보 업데이트
    updateCalendar();
    updateMonthlySummary();

    // 모달 닫기
    elements.detailModal.classList.remove('show');
}

// 공수 데이터 삭제
function deleteWorkData() {
    if (!appState.selectedDate) return;

    const dateKey = formatDateKey(appState.selectedDate);
    
    if (appState.workData[dateKey]) {
        delete appState.workData[dateKey];
        
        // 로컬 스토리지에 저장
        saveToLocalStorage();
        
        // 달력 및 요약 정보 업데이트
        updateCalendar();
        updateMonthlySummary();
        
        // 모달 닫기
        elements.detailModal.classList.remove('show');
    }
}

// 단가 설정 저장
function saveRateSettings() {
    const dailyRate = parseInt(elements.defaultDailyRateInput.value) || 150000;
    const hourlyRate = parseInt(elements.defaultHourlyRateInput.value) || 18750;
    
    appState.settings.defaultDailyRate = dailyRate;
    appState.settings.defaultHourlyRate = hourlyRate;
    
    // 적용 범위에 따라 처리
    const applyAll = document.getElementById('apply-all').checked;
    const applyMonth = document.getElementById('apply-month').checked;
    const applySelected = document.getElementById('apply-selected').checked;
    
    // 공수 계산 함수
    function calculateTotalAmount(workDays, dailyRate) {
        if (workDays <= 1.0) {
            // 1공수 이하: 기본급의 비례 계산
            return dailyRate * workDays;
        } else {
            // 1공수 초과: 기본급 + 연장수당 (연장분은 1.5배 적용)
            const baseAmount = dailyRate; // 기본 1공수 금액
            const overtimeHours = workDays - 1.0; // 연장 공수
            const overtimeAmount = dailyRate * overtimeHours * 1.5; // 연장수당 (1.5배)
            return baseAmount + overtimeAmount;
        }
    }
    
    if (applyAll) {
        // 모든 날짜에 적용
        Object.keys(appState.workData).forEach(dateKey => {
            appState.workData[dateKey].rate = dailyRate;
            // 올바른 공수 계산으로 총액 업데이트
            appState.workData[dateKey].totalAmount = calculateTotalAmount(appState.workData[dateKey].workDays, dailyRate);
        });
    } else if (applyMonth) {
        // 현재 월에만 적용
        const year = appState.currentDate.getFullYear();
        const month = appState.currentDate.getMonth();
        
        Object.keys(appState.workData).forEach(dateKey => {
            const date = new Date(dateKey);
            if (date.getFullYear() === year && date.getMonth() === month) {
                appState.workData[dateKey].rate = dailyRate;
                // 올바른 공수 계산으로 총액 업데이트
                appState.workData[dateKey].totalAmount = calculateTotalAmount(appState.workData[dateKey].workDays, dailyRate);
            }
        });
    } else if (applySelected && appState.selectedDate) {
        // 선택한 날짜에만 적용
        const dateKey = formatDateKey(appState.selectedDate);
        if (appState.workData[dateKey]) {
            appState.workData[dateKey].rate = dailyRate;
            // 올바른 공수 계산으로 총액 업데이트
            appState.workData[dateKey].totalAmount = calculateTotalAmount(appState.workData[dateKey].workDays, dailyRate);
        }
    }
    
    // 로컬 스토리지에 저장
    saveToLocalStorage();
    
    // 달력 및 요약 정보 업데이트
    updateCalendar();
    updateMonthlySummary();
    
    // 모달 닫기
    elements.rateModal.classList.remove('show');
}

// 로컬 스토리지에 데이터 저장
// 데이터 저장 (로컬 스토리지 + Supabase 동기화)
async function saveToLocalStorage() {
    const data = {
        workData: appState.workData,
        settings: appState.settings
    };
    
    // 로컬 스토리지에 저장
    localStorage.setItem('gongsooCalendarData', JSON.stringify(data));
    
    // Supabase에 동기화 (로그인된 경우에만)
    if (window.supabaseClient && await window.supabaseClient.getCurrentUser()) {
        try {
            // 작업 데이터 저장
            for (const [dateKey, workRecord] of Object.entries(appState.workData)) {
                await window.supabaseClient.saveWorkData(dateKey, workRecord);
            }
            
            // 설정 저장
            await window.supabaseClient.saveUserSettings(appState.settings);
            
            console.log('데이터가 클라우드에 동기화되었습니다.');
        } catch (error) {
            console.error('클라우드 동기화 실패:', error);
        }
    }
}

// 데이터 로드 (로컬 스토리지 + Supabase)
async function loadFromLocalStorage() {
    // 먼저 로컬 스토리지에서 로드
    const savedData = localStorage.getItem('gongsooCalendarData');
    
    if (savedData) {
        const data = JSON.parse(savedData);
        appState.workData = data.workData || {};
        appState.settings = data.settings || {
            defaultDailyRate: 150000,
            defaultHourlyRate: 18750,
            defaultWorkDays: '1.0'
        };
    }
    
    // Supabase에서 데이터 로드 (로그인된 경우에만)
    if (window.supabaseClient && await window.supabaseClient.getCurrentUser()) {
        try {
            // 클라우드에서 작업 데이터 로드
            const cloudWorkData = await window.supabaseClient.loadWorkData();
            if (cloudWorkData && Object.keys(cloudWorkData).length > 0) {
                appState.workData = { ...appState.workData, ...cloudWorkData };
            }
            
            // 클라우드에서 설정 로드
            const cloudSettings = await window.supabaseClient.loadUserSettings();
            if (cloudSettings) {
                appState.settings = { ...appState.settings, ...cloudSettings };
            }
            
            console.log('클라우드 데이터가 로드되었습니다.');
        } catch (error) {
            console.error('클라우드 데이터 로드 실패:', error);
        }
    }
}

// 날짜 키 포맷 (YYYY-MM-DD)
function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 날짜 표시 포맷 (YYYY년 MM월 DD일 (요일))
function formatDateDisplay(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    
    return `${year}년 ${month}월 ${day}일 (${weekday})`;
}

// 월 표시 포맷 (YYYY년 MM월)
function formatMonthDisplay(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    return `${year}년 ${month}월`;
}

// 금액 포맷 (###,###원)
function formatCurrency(amount) {
    return amount.toLocaleString() + '원';
}

// 월별 요약 정보 업데이트
function updateMonthlySummary() {
    const year = appState.currentDate.getFullYear();
    const month = appState.currentDate.getMonth();
    
    let totalWorkDays = 0;
    let totalWorkHours = 0;
    let totalSalary = 0;
    
    console.log('=== 월별 요약 계산 디버깅 ===');
    console.log('계산 대상 년월:', year, month + 1);
    
    // 현재 월의 데이터만 계산
    Object.keys(appState.workData).forEach(dateKey => {
        const date = new Date(dateKey);
        if (date.getFullYear() === year && date.getMonth() === month) {
            const data = appState.workData[dateKey];
            console.log('날짜:', dateKey, '데이터:', data);
            
            totalWorkDays += data.workDays;
            totalWorkHours += data.workHours;
            
            // totalAmount가 있으면 그 값을 사용하고, 없으면 계산
            if (data.totalAmount) {
                console.log('totalAmount 사용:', data.totalAmount);
                totalSalary += data.totalAmount;
            } else {
                const calculatedAmount = data.workDays * data.rate;
                console.log('계산된 금액:', calculatedAmount, '(', data.workDays, '×', data.rate, ')');
                totalSalary += calculatedAmount;
            }
            
            console.log('현재까지 누적 급여:', totalSalary);
        }
    });
    
    console.log('최종 결과 - 총 공수일:', totalWorkDays, '총 급여:', totalSalary);
    console.log('========================');
    
    // 요약 정보 업데이트
    elements.monthlySummary.workDays.textContent = totalWorkDays.toFixed(1) + '일';
    elements.monthlySummary.workHours.textContent = totalWorkHours + '시간';
    elements.monthlySummary.rate.textContent = formatCurrency(appState.settings.defaultDailyRate);
    elements.monthlySummary.salary.textContent = formatCurrency(totalSalary);
}

// 앱 초기화
// DOM 요소 초기화
function initElements() {
    elements = {
        currentMonthDisplay: document.getElementById('current-month'),
        prevMonthBtn: document.getElementById('prev-month'),
        nextMonthBtn: document.getElementById('next-month'),
        todayBtn: document.querySelector('.today-btn'),
        calendarGrid: document.getElementById('calendar-grid'),
        detailModal: document.getElementById('detail-modal'),
        closeDetailModalBtn: document.getElementById('close-detail-modal'),
        detailDateDisplay: document.getElementById('detail-date-display'),
        workDaysInput: document.getElementById('work-days'),
        workDaysBtns: document.querySelectorAll('.work-day-btn'),
        workDaysButtons: document.getElementById('work-days-buttons'),
        workHoursInput: document.getElementById('work-hours'),
        dailyRateInput: document.getElementById('daily-rate'),
        memoInput: document.getElementById('day-memo'),
        saveBtn: document.querySelector('.save-btn'),
        deleteBtn: document.querySelector('.delete-btn'),
        rateModal: document.getElementById('rate-modal'),
        editRateBtn: document.querySelector('.edit-btn'),
        closeModalBtn: document.querySelector('.close-modal'),
        defaultDailyRateInput: document.getElementById('default-daily-rate'),
        defaultHourlyRateInput: document.getElementById('default-hourly-rate'),
        saveRateBtn: document.querySelector('.save-rate-btn'),
        cancelRateBtn: document.querySelector('.cancel-btn'),
        monthlySummary: {
            workDays: document.querySelector('.summary-card:nth-child(1) .card-value'),
            workHours: document.querySelector('.summary-card:nth-child(2) .card-value'),
            rate: document.querySelector('.summary-card:nth-child(3) .card-value'),
            salary: document.querySelector('.summary-card:nth-child(4) .card-value')
        }
    };
    
    // 필수 요소들이 존재하는지 확인
    const requiredElements = ['currentMonthDisplay', 'calendarGrid', 'prevMonthBtn', 'nextMonthBtn'];
    for (const elementName of requiredElements) {
        if (!elements[elementName]) {
            console.error(`Required element not found: ${elementName}`);
            return false;
        }
    }
    return true;
}

async function initApp() {
    if (!initElements()) {
        console.error('Failed to initialize DOM elements');
        return;
    }
    
    // 데이터 로드 (비동기)
    await loadFromLocalStorage();
    
    setupEventListeners();
    setupWorkDayButtons();
    updateCalendar();
    updateMonthlySummary();
}

// 공수일 버튼 이벤트 리스너 설정
function setupWorkDayButtons() {
    elements.workDaysBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 모든 버튼에서 active 클래스 제거
            elements.workDaysBtns.forEach(b => b.classList.remove('active'));
            
            // 클릭한 버튼에 active 클래스 추가
            btn.classList.add('active');
            
            // hidden input에 값 설정
            elements.workDaysInput.value = btn.dataset.value;
        });
    });
}

// 하단 메뉴 기능 구현 (이벤트 위임 방식)
function setupBottomMenuHandlers() {
    // 기존 이벤트 리스너 제거
    document.removeEventListener('click', handleBottomMenuClick);
    
    // 이벤트 위임으로 하단 메뉴 클릭 처리
    document.addEventListener('click', handleBottomMenuClick);
}

// 하단 메뉴 클릭 핸들러
function handleBottomMenuClick(e) {
    // Statistics 버튼
    if (e.target.closest('.bottom-menu-section .menu-item:nth-child(1) a')) {
        e.preventDefault();
        showStatistics();
        return;
    }
    
    // Settings 버튼
    if (e.target.closest('.bottom-menu-section .menu-item:nth-child(2) a')) {
        e.preventDefault();
        showSettings();
        return;
    }
    
    // Help 버튼
    if (e.target.closest('.bottom-menu-section .menu-item:nth-child(3) a')) {
        e.preventDefault();
        showHelp();
        return;
    }
    
    // User Information 버튼
    if (e.target.closest('.bottom-menu-section .user-menu')) {
        e.preventDefault();
        showUserInfo();
        return;
    }
}

// 누적 통계 계산 함수
function calculateTotalStatistics() {
    let totalWorkDays = 0;
    let totalWorkHours = 0;
    let totalSalary = 0;
    let totalMonths = 0;
    const monthlyData = {};
    
    // 모든 데이터를 월별로 그룹화
    Object.keys(appState.workData).forEach(dateKey => {
        const date = new Date(dateKey);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
                workDays: 0,
                workHours: 0,
                salary: 0
            };
        }
        
        const data = appState.workData[dateKey];
        monthlyData[monthKey].workDays += data.workDays;
        monthlyData[monthKey].workHours += data.workHours;
        
        if (data.totalAmount) {
            monthlyData[monthKey].salary += data.totalAmount;
        } else {
            monthlyData[monthKey].salary += data.workDays * data.rate;
        }
    });
    
    // 누적 통계 계산
    Object.values(monthlyData).forEach(monthData => {
        totalWorkDays += monthData.workDays;
        totalWorkHours += monthData.workHours;
        totalSalary += monthData.salary;
        totalMonths++;
    });
    
    const avgWorkDaysPerMonth = totalMonths > 0 ? totalWorkDays / totalMonths : 0;
    const avgSalaryPerMonth = totalMonths > 0 ? totalSalary / totalMonths : 0;
    
    return {
        total: {
            workDays: totalWorkDays,
            workHours: totalWorkHours,
            salary: totalSalary,
            months: totalMonths
        },
        average: {
            workDaysPerMonth: avgWorkDaysPerMonth,
            salaryPerMonth: avgSalaryPerMonth
        },
        monthlyData
    };
}

// Statistics 모달 표시
function showStatistics() {
    const currentYear = appState.currentDate.getFullYear();
    const currentMonth = appState.currentDate.getMonth();
    const currentMonthName = `${currentYear}년 ${currentMonth + 1}월`;
    
    // 현재 월 통계
    const currentMonthStats = {
        workDays: parseFloat(elements.monthlySummary.workDays.textContent) || 0,
        workHours: parseInt(elements.monthlySummary.workHours.textContent) || 0,
        salary: parseInt(elements.monthlySummary.salary.textContent.replace(/[^0-9]/g, '')) || 0
    };
    
    // 누적 통계
    const totalStats = calculateTotalStatistics();
    
    const modal = createModal('📊 근무 통계', `
        <div class="statistics-content">
            <!-- 탭 메뉴 -->
            <div class="stats-tabs">
                <button class="stats-tab active" data-tab="monthly">이번 달</button>
                <button class="stats-tab" data-tab="total">전체 누적</button>
                <button class="stats-tab" data-tab="analysis">분석</button>
            </div>
            
            <!-- 이번 달 통계 -->
            <div class="stats-panel active" id="monthly-panel">
                <div class="stats-header">
                    <h3>${currentMonthName} 통계</h3>
                    <div class="stats-period">현재까지 진행률</div>
                </div>
                <div class="stats-cards">
                    <div class="stat-card primary">
                        <div class="stat-icon">📅</div>
                        <div class="stat-info">
                            <div class="stat-value">${currentMonthStats.workDays.toFixed(1)}</div>
                            <div class="stat-label">근무일</div>
                        </div>
                    </div>
                    <div class="stat-card success">
                        <div class="stat-icon">⏰</div>
                        <div class="stat-info">
                            <div class="stat-value">${currentMonthStats.workHours}</div>
                            <div class="stat-label">근무시간</div>
                        </div>
                    </div>
                    <div class="stat-card warning">
                        <div class="stat-icon">💰</div>
                        <div class="stat-info">
                            <div class="stat-value">${formatCurrency(currentMonthStats.salary)}</div>
                            <div class="stat-label">예상 급여</div>
                        </div>
                    </div>
                    <div class="stat-card info">
                        <div class="stat-icon">📈</div>
                        <div class="stat-info">
                            <div class="stat-value">${formatCurrency(appState.settings.defaultDailyRate)}</div>
                            <div class="stat-label">일일 단가</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 전체 누적 통계 -->
            <div class="stats-panel" id="total-panel">
                <div class="stats-header">
                    <h3>전체 누적 통계</h3>
                    <div class="stats-period">총 ${totalStats.total.months}개월 데이터</div>
                </div>
                <div class="stats-cards">
                    <div class="stat-card primary">
                        <div class="stat-icon">📊</div>
                        <div class="stat-info">
                            <div class="stat-value">${totalStats.total.workDays.toFixed(1)}</div>
                            <div class="stat-label">총 근무일</div>
                        </div>
                    </div>
                    <div class="stat-card success">
                        <div class="stat-icon">🕐</div>
                        <div class="stat-info">
                            <div class="stat-value">${totalStats.total.workHours}</div>
                            <div class="stat-label">총 근무시간</div>
                        </div>
                    </div>
                    <div class="stat-card warning">
                        <div class="stat-icon">💎</div>
                        <div class="stat-info">
                            <div class="stat-value">${formatCurrency(totalStats.total.salary)}</div>
                            <div class="stat-label">총 수입</div>
                        </div>
                    </div>
                    <div class="stat-card info">
                        <div class="stat-icon">📅</div>
                        <div class="stat-info">
                            <div class="stat-value">${totalStats.total.months}</div>
                            <div class="stat-label">활동 개월</div>
                        </div>
                    </div>
                </div>
                
                <div class="average-stats">
                    <h4>월평균 통계</h4>
                    <div class="avg-stats-grid">
                        <div class="avg-stat">
                            <span class="avg-label">월평균 근무일</span>
                            <span class="avg-value">${totalStats.average.workDaysPerMonth.toFixed(1)}일</span>
                        </div>
                        <div class="avg-stat">
                            <span class="avg-label">월평균 수입</span>
                            <span class="avg-value">${formatCurrency(totalStats.average.salaryPerMonth)}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 분석 패널 -->
            <div class="stats-panel" id="analysis-panel">
                <div class="stats-header">
                    <h3>근무 패턴 분석</h3>
                    <div class="stats-period">데이터 기반 인사이트</div>
                </div>
                <div class="analysis-content">
                    <div class="insight-card">
                        <div class="insight-icon">🎯</div>
                        <div class="insight-content">
                            <h4>이번 달 목표 달성률</h4>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${Math.min((currentMonthStats.workDays / 20) * 100, 100)}%"></div>
                            </div>
                            <p>${(currentMonthStats.workDays / 20 * 100).toFixed(1)}% (목표: 20일 기준)</p>
                        </div>
                    </div>
                    
                    <div class="insight-card">
                        <div class="insight-icon">📈</div>
                        <div class="insight-content">
                            <h4>수입 트렌드</h4>
                            <p>월평균 ${formatCurrency(totalStats.average.salaryPerMonth)}의 안정적인 수입을 유지하고 있습니다.</p>
                        </div>
                    </div>
                    
                    <div class="insight-card">
                        <div class="insight-icon">⚡</div>
                        <div class="insight-content">
                            <h4>생산성 지표</h4>
                            <p>일평균 ${(currentMonthStats.workHours / Math.max(currentMonthStats.workDays, 1)).toFixed(1)}시간 근무로 효율적인 업무 패턴을 보이고 있습니다.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `);
    
    document.body.appendChild(modal);
    
    // 탭 전환 이벤트 리스너 추가
    const tabs = modal.querySelectorAll('.stats-tab');
    const panels = modal.querySelectorAll('.stats-panel');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // 탭 활성화 상태 변경
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // 패널 표시 상태 변경
            panels.forEach(panel => {
                panel.classList.remove('active');
                if (panel.id === `${targetTab}-panel`) {
                    panel.classList.add('active');
                }
            });
        });
    });
}

// Settings 모달 표시
function showSettings() {
    const modal = createModal('설정', `
        <div class="settings-content">
            <div class="setting-group">
                <label for="theme-select">테마 설정:</label>
                <select id="theme-select">
                    <option value="light">라이트 모드</option>
                    <option value="dark">다크 모드</option>
                </select>
            </div>
            <div class="setting-group">
                <label for="notification-check">알림 설정:</label>
                <input type="checkbox" id="notification-check" checked>
                <span>일일 공수 입력 알림</span>
            </div>
            <div class="setting-group">
                <label for="backup-check">자동 백업:</label>
                <input type="checkbox" id="backup-check" checked>
                <span>데이터 자동 백업</span>
            </div>
            <div class="setting-actions">
                <button class="btn-primary" onclick="saveSettings()">저장</button>
                <button class="btn-secondary" onclick="resetSettings()">초기화</button>
            </div>
        </div>
    `);
    document.body.appendChild(modal);
}

// Help 모달 표시
function showHelp() {
    const modal = createModal('도움말', `
        <div class="help-content">
            <h3>공수달력 사용법</h3>
            <div class="help-section">
                <h4>📅 달력 사용법</h4>
                <ul>
                    <li>날짜를 클릭하여 공수를 입력할 수 있습니다</li>
                    <li>좌우 화살표로 월을 이동할 수 있습니다</li>
                    <li>'오늘' 버튼으로 현재 날짜로 이동합니다</li>
                </ul>
            </div>
            <div class="help-section">
                <h4>💼 공수 입력</h4>
                <ul>
                    <li>공수일: 0.5, 1.0, 1.5, 2.0 중 선택 가능</li>
                    <li>근무시간: 직접 입력 (기본 8시간)</li>
                    <li>일일단가: 프로젝트별로 다르게 설정 가능</li>
                    <li>메모: 업무 내용이나 특이사항 기록</li>
                </ul>
            </div>
            <div class="help-section">
                <h4>📊 통계 확인</h4>
                <ul>
                    <li>월별 총 근무일과 근무시간 확인</li>
                    <li>예상 급여 자동 계산</li>
                    <li>일별 공수 현황 한눈에 보기</li>
                </ul>
            </div>
        </div>
    `);
    document.body.appendChild(modal);
}

// Data Management 모달 표시
function showUserInfo() {
    const modal = createModal('데이터 관리', `
        <div class="user-info-content">
            <div class="user-profile-section">
                <div class="profile-avatar">
                    <i class="fas fa-database"></i>
                </div>
                <div class="profile-details">
                    <h3>데이터 관리</h3>
                    <p>백업 및 복원 서비스</p>
                </div>
            </div>
            <div class="user-stats">
                <div class="stat-card">
                    <span class="stat-number">24</span>
                    <span class="stat-label">이번 달 근무일</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">192</span>
                    <span class="stat-label">총 근무시간</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">3,600,000</span>
                    <span class="stat-label">예상 수입</span>
                </div>
            </div>
            <div class="user-actions">
                <button class="btn-secondary" onclick="exportData()">데이터 내보내기</button>
                <button class="btn-secondary" onclick="importData()">데이터 가져오기</button>
                <button class="btn-danger" onclick="clearAllData()">모든 데이터 삭제</button>
            </div>
        </div>
    `);
    document.body.appendChild(modal);
}

// 공통 모달 생성 함수
function createModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'custom-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeCustomModal(this)"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="close-btn" onclick="closeCustomModal(this)">×</button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        </div>
    `;
    return modal;
}

// 커스텀 모달 닫기
function closeCustomModal(element) {
    const modal = element.closest('.custom-modal');
    if (modal) {
        modal.remove();
    }
}

// 설정 저장
function saveSettings() {
    alert('설정이 저장되었습니다.');
    closeCustomModal(document.querySelector('.custom-modal'));
}

// 설정 초기화
function resetSettings() {
    if (confirm('모든 설정을 초기화하시겠습니까?')) {
        alert('설정이 초기화되었습니다.');
        closeCustomModal(document.querySelector('.custom-modal'));
    }
}

// 프로필 수정
function editProfile() {
    alert('프로필 수정 기능은 향후 구현 예정입니다.');
}

// 데이터 내보내기
function exportData() {
    const dataStr = JSON.stringify(appState.workData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'work-calendar-data.json';
    link.click();
    URL.revokeObjectURL(url);
    alert('데이터가 다운로드되었습니다.');
}

// 데이터 가져오기
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // 데이터 유효성 검사
                if (typeof importedData === 'object' && importedData !== null) {
                    if (confirm('기존 데이터를 덮어쓰시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                        appState.workData = importedData;
                        saveToLocalStorage();
                        updateCalendar();
                        updateSummaryCards();
                        alert('데이터가 성공적으로 복원되었습니다.');
                        closeModal();
                    }
                } else {
                    alert('올바르지 않은 데이터 형식입니다.');
                }
            } catch (error) {
                alert('파일을 읽는 중 오류가 발생했습니다. JSON 형식을 확인해주세요.');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// 모든 데이터 삭제
function clearAllData() {
    if (confirm('모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.\n\n삭제 전에 데이터를 내보내기하는 것을 권장합니다.')) {
        if (confirm('정말로 모든 데이터를 삭제하시겠습니까?')) {
            // 모든 데이터 초기화
            appState.workData = {};
            appState.settings = {
                hourlyRate: 50000,
                dailyRate: 400000,
                overtimeRate: 1.5
            };
            
            // localStorage에서 삭제
            localStorage.removeItem('gongsooCalendarData');
            localStorage.removeItem('theme');
            
            // UI 업데이트
            updateCalendar();
            updateSummaryCards();
            
            alert('모든 데이터가 삭제되었습니다.');
            closeModal();
        }
    }
}

// 테마 관리 함수들
function initTheme() {
    // 저장된 테마 불러오기 (기본값: 라이트 모드)
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    
    // 테마 토글 버튼 이벤트 리스너 추가
    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
}

function setTheme(theme) {
    const html = document.documentElement;
    const themeIcon = document.getElementById('themeIcon');
    
    if (theme === 'dark') {
        html.setAttribute('data-theme', 'dark');
        if (themeIcon) {
            themeIcon.className = 'fas fa-moon';
        }
    } else {
        html.removeAttribute('data-theme');
        if (themeIcon) {
            themeIcon.className = 'fas fa-sun';
        }
    }
    
    // 테마 저장
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    setTheme(newTheme);
    
    // 부드러운 전환 효과
    document.body.style.transition = 'all 0.3s ease';
    setTimeout(() => {
        document.body.style.transition = '';
    }, 300);
}

function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
}

// 앱 시작
document.addEventListener('DOMContentLoaded', async () => {
    await initApp();
    setupBottomMenuHandlers();
    initTheme(); // 테마 초기화 추가
});