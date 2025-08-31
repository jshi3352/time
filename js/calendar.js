/**
 * 공수달력 캘린더 컴포넌트
 */

// 달력 렌더링
function updateCalendar() {
    const year = appState.currentDate.getFullYear();
    const month = appState.currentDate.getMonth();
    
    // 월 표시 업데이트
    elements.currentMonthDisplay.textContent = formatMonthDisplay(appState.currentDate);
    
    // 달력 그리드 초기화 (날짜 셀만)
    elements.calendarGrid.innerHTML = '';
    
    // 이번 달의 첫 날
    const firstDay = new Date(year, month, 1);
    // 이번 달의 마지막 날
    const lastDay = new Date(year, month + 1, 0);
    
    // 이번 달 첫 날의 요일 (0: 일요일, 1: 월요일, ...)
    const firstDayOfWeek = firstDay.getDay();
    
    // 이전 달의 마지막 날
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    // 이전 달의 날짜 채우기
    for (let i = 0; i < firstDayOfWeek; i++) {
        const day = prevMonthLastDay - firstDayOfWeek + i + 1;
        const dayElement = createDayElement(new Date(year, month - 1, day), true);
        elements.calendarGrid.appendChild(dayElement);
    }
    
    // 이번 달 날짜 채우기
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayElement = createDayElement(new Date(year, month, day));
        elements.calendarGrid.appendChild(dayElement);
    }
    
    // 다음 달 날짜 채우기 (6주 채우기)
    const totalCells = 42; // 6주 x 7일
    const remainingCells = totalCells - (firstDayOfWeek + lastDay.getDate());
    
    for (let day = 1; day <= remainingCells; day++) {
        const dayElement = createDayElement(new Date(year, month + 1, day), true);
        elements.calendarGrid.appendChild(dayElement);
    }
    
    // 월별 요약 정보 업데이트
    updateMonthlySummary();
}

// 날짜 요소 생성
function createDayElement(date, isOtherMonth = false) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    // 다른 달 날짜 스타일 적용
    if (isOtherMonth) {
        dayElement.classList.add('other-month');
    }
    
    // 주말 스타일 적용
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) { // 일요일
        dayElement.classList.add('sunday');
    } else if (dayOfWeek === 6) { // 토요일
        dayElement.classList.add('saturday');
    }
    
    // 오늘 날짜 스타일 적용
    const today = new Date();
    if (date.getDate() === today.getDate() && 
        date.getMonth() === today.getMonth() && 
        date.getFullYear() === today.getFullYear()) {
        dayElement.classList.add('today');
    }
    
    // 날짜 숫자 요소
    const dayNumber = document.createElement('span');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date.getDate();
    dayElement.appendChild(dayNumber);
    
    // 공수 데이터 표시
    const dateKey = formatDateKey(date);
    const workData = appState.workData[dateKey];
    
    if (workData) {
        // 공수 일수 표시
        if (workData.workDays > 0) {
            const workIndicator = document.createElement('div');
            workIndicator.className = 'work-indicator';
            workIndicator.textContent = workData.workDays.toFixed(1);
            dayElement.appendChild(workIndicator);
        }
        
        // 총액 표시 (공수일 × 일당)
        if (workData.totalAmount) {
            const rateIndicator = document.createElement('div');
            rateIndicator.className = 'rate-indicator';
            rateIndicator.innerHTML = `<i class="fas fa-won-sign"></i>${Math.round(workData.totalAmount / 10000)}만원`;
            dayElement.appendChild(rateIndicator);
        } else if (workData.rate) {
            // 기존 데이터 호환성을 위한 처리
            const rateIndicator = document.createElement('div');
            rateIndicator.className = 'rate-indicator';
            const amount = workData.workDays * workData.rate;
            rateIndicator.innerHTML = `<i class="fas fa-won-sign"></i>${Math.round(amount / 10000)}만원`;
            dayElement.appendChild(rateIndicator);
        }
        
        // 메모 표시
        if (workData.memo) {
            const memoIndicator = document.createElement('div');
            memoIndicator.className = 'memo-indicator';
            memoIndicator.innerHTML = '<i class="fas fa-sticky-note"></i>';
            dayElement.appendChild(memoIndicator);
        }
    }
    
    // 날짜 클릭 이벤트
    dayElement.addEventListener('click', () => {
        // 선택된 날짜 업데이트
        appState.selectedDate = new Date(date);
        
        // 선택된 날짜 표시
        document.getElementById('detail-date-display').textContent = formatDateDisplay(date);
        
        // 공수 데이터 표시
        if (workData) {
            // hidden input에 값 설정
            elements.workDaysInput.value = workData.workDays;
            
            // 해당 값에 맞는 버튼 활성화
            elements.workDaysBtns.forEach(btn => {
                if (parseFloat(btn.dataset.value) === workData.workDays) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            elements.workHoursInput.value = workData.workHours;
            elements.dailyRateInput.value = workData.rate;
            elements.memoInput.value = workData.memo;
        } else {
            // 기본값 설정
            elements.workDaysInput.value = '1.0';
            
            // 기본값에 맞는 버튼 활성화
            const defaultWorkDays = appState.settings.defaultWorkDays || '1.0';
            elements.workDaysInput.value = defaultWorkDays;
            elements.workDaysBtns.forEach(btn => {
                if (btn.dataset.value === defaultWorkDays) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            elements.workHoursInput.value = '8';
            elements.dailyRateInput.value = appState.settings.defaultDailyRate;
            elements.memoInput.value = '';
        }
        
        // 모달 표시
        document.getElementById('detail-modal').classList.add('show');
    });
    
    return dayElement;
}

// 공휴일 데이터 (예시)
const holidays = {
    '2024-01-01': '신정',
    '2024-02-10': '설날',
    '2024-03-01': '삼일절',
    '2024-05-05': '어린이날',
    '2024-05-15': '부처님오신날',
    '2024-06-06': '현충일',
    '2024-08-15': '광복절',
    '2024-09-17': '추석',
    '2024-10-03': '개천절',
    '2024-10-09': '한글날',
    '2024-12-25': '크리스마스',
    '2025-01-01': '신정',
    '2025-01-29': '설날',
    '2025-03-01': '삼일절',
    '2025-05-05': '어린이날',
    '2025-05-12': '부처님오신날',
    '2025-06-06': '현충일',
    '2025-08-15': '광복절',
    '2025-10-06': '추석',
    '2025-10-03': '개천절',
    '2025-10-09': '한글날',
    '2025-12-25': '크리스마스'
};

// 공휴일 체크 함수
function isHoliday(date) {
    const dateKey = formatDateKey(date);
    return holidays[dateKey] !== undefined;
}

// 공휴일 이름 가져오기
function getHolidayName(date) {
    const dateKey = formatDateKey(date);
    return holidays[dateKey];
}

// 날짜 선택 함수
function selectDate(date) {
    appState.selectedDate = new Date(date);
    updateCalendar();
    
    // 선택된 날짜가 현재 표시된 월에 없으면 해당 월로 이동
    if (appState.selectedDate.getMonth() !== appState.currentDate.getMonth() ||
        appState.selectedDate.getFullYear() !== appState.currentDate.getFullYear()) {
        appState.currentDate = new Date(appState.selectedDate);
        updateCalendar();
    }
}

// 날짜 비교 함수 (년, 월, 일만 비교)
function isSameDate(date1, date2) {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
}