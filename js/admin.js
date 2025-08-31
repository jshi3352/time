// 관리자 페이지 JavaScript 기능

// 전역 변수
let isLoggedIn = false;
let currentSection = 'dashboard';
// 로컬 스토리지에서 광고 슬롯 데이터 로드
let adSlots = JSON.parse(localStorage.getItem('adSlots')) || [];
// 위치별 광고 스크립트 데이터
let adScripts = JSON.parse(localStorage.getItem('adScripts')) || {
    header: { script: '', active: false },
    content: { script: '', active: false },
    sidebar: { script: '', active: false },
    footer: { script: '', active: false }
};

// GitHub 배포 관리 변수
let deploymentStatus = {
    connected: false,
    repository: '',
    lastDeploy: null,
    deployUrl: ''
};

// 데이터베이스 관리 변수
let dbStatus = {
    connected: false,
    projectUrl: '',
    lastBackup: null,
    userCount: 0
};

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
});

// 관리자 페이지 초기화
function initializeAdmin() {
    // 로그인 상태 확인
    checkLoginStatus();
    
    // 이벤트 리스너 등록
    setupEventListeners();
    
    // 초기 데이터 로드
    if (isLoggedIn) {
        showSection('overview');
        updateStats();
        initializeAdPositionManagement();
    }
}

// 로그인 상태 확인
function checkLoginStatus() {
    const loginStatus = localStorage.getItem('adminLoggedIn');
    const loginTime = localStorage.getItem('loginTime');
    
    // 세션 만료 체크 (24시간)
    const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24시간
    const currentTime = Date.now();
    
    if (loginStatus === 'true' && loginTime) {
        const timeDiff = currentTime - parseInt(loginTime);
        
        if (timeDiff > SESSION_TIMEOUT) {
            // 세션 만료
            handleLogout();
            alert('세션이 만료되었습니다. 다시 로그인해주세요.');
            return;
        }
        
        isLoggedIn = true;
        showDashboard();
    } else {
        isLoggedIn = false;
        showLogin();
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 로그인 폼
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // 로그아웃 버튼
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // 네비게이션 버튼들
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.target.dataset.section;
            showSection(section);
        });
    });
    
    // 위치별 토글 스위치
    const toggleSwitches = document.querySelectorAll('.toggle-switch input');
    toggleSwitches.forEach(toggle => {
        toggle.addEventListener('change', handleTogglePosition);
    });
    
    // 위치별 저장 버튼
    const saveButtons = document.querySelectorAll('.btn-save');
    saveButtons.forEach(btn => {
        btn.addEventListener('click', handleSaveScript);
    });
    
    // 계정 정보 변경 버튼
    const changeCredentialsBtn = document.getElementById('change-credentials-btn');
    if (changeCredentialsBtn) {
        changeCredentialsBtn.addEventListener('click', handleChangeCredentials);
    }
    
    // 모달 닫기
    const closeModal = document.querySelector('.close');
    if (closeModal) {
        closeModal.addEventListener('click', closeEditModal);
    }
    
    // 모달 외부 클릭 시 닫기
    const modal = document.getElementById('editAdModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeEditModal();
            }
        });
    }
}

// 로그인 처리
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // ⚠️ 보안 경고: 실제 운영 환경에서는 다음 사항을 반드시 구현해야 합니다:
    // 1. 서버 사이드 인증 시스템 구현
    // 2. 비밀번호 해싱 (bcrypt 등)
    // 3. JWT 토큰 또는 세션 기반 인증
    // 4. HTTPS 사용 필수
    // 5. 비밀번호 복잡도 정책 적용
    // 현재는 데모 목적으로만 사용
    
    // 저장된 계정 정보 가져오기 (기본값: admin/admin123)
    const storedUsername = localStorage.getItem('adminUsername') || 'admin';
    const storedPassword = localStorage.getItem('adminPassword') || 'admin123';
    
    if (username === storedUsername && password === storedPassword) {
        isLoggedIn = true;
        // 실제 환경에서는 JWT 토큰을 사용하고 만료 시간을 설정해야 함
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.setItem('loginTime', Date.now().toString());
        showDashboard();
        showSection('overview');
        updateStats();
    } else {
        // 보안을 위해 구체적인 오류 정보를 노출하지 않음
        alert('로그인에 실패했습니다. 다시 시도해주세요.');
        // 실제 환경에서는 로그인 시도 횟수 제한 구현 필요
    }
}

// 로그아웃 처리
function handleLogout() {
    isLoggedIn = false;
    // 모든 세션 관련 데이터 정리
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('loginTime');
    
    // 현재 섹션 초기화
    currentSection = 'dashboard';
    
    showLogin();
}

// 로그인 화면 표시
function showLogin() {
    const loginSection = document.getElementById('login-section');
    const dashboard = document.getElementById('admin-dashboard');
    if (loginSection) loginSection.style.display = 'flex';
    if (dashboard) dashboard.style.display = 'none';
}

// 대시보드 표시
function showDashboard() {
    const loginSection = document.getElementById('login-section');
    const dashboard = document.getElementById('admin-dashboard');
    if (loginSection) loginSection.style.display = 'none';
    if (dashboard) dashboard.style.display = 'flex';
}

// 섹션 전환
function showSection(sectionName) {
    // 모든 섹션 숨기기
    const sections = document.querySelectorAll('.admin-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // 모든 네비게이션 버튼 비활성화
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 섹션 이름을 실제 ID로 매핑
    const sectionMapping = {
        'overview': 'overview-section',
        'ad-management': 'ad-management-section', 
        'performance': 'performance-section',
        'settings': 'settings-section',
        'github-deploy': 'github-deploy-section',
        'database-management': 'database-management-section'
    };
    
    const actualSectionId = sectionMapping[sectionName] || sectionName + '-section';
    
    // 선택된 섹션 표시
    const targetSection = document.getElementById(actualSectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // 선택된 네비게이션 버튼 활성화
    const targetNavBtn = document.querySelector(`[data-section="${sectionName}"]`);
    if (targetNavBtn) {
        targetNavBtn.classList.add('active');
    }
    
    currentSection = sectionName;
    
    // 섹션별 특별 처리
    switch(sectionName) {
        case 'overview':
            updateStats();
            break;
        case 'ad-management':
            initializeAdPositionManagement();
            break;
        case 'performance':
            loadPerformanceData();
            break;
        case 'settings':
            loadSettings();
            break;
        case 'github-deploy':
            loadGitHubDeployment();
            break;
        case 'database-management':
            loadDatabaseManagement();
            break;
    }
}

// 대시보드 데이터 로드
function loadDashboard() {
    updateStats();
    updateRevenueChart();
}

// 통계 업데이트
function updateStats() {
    const totalRevenue = adSlots.reduce((sum, slot) => sum + slot.revenue, 0);
    const totalClicks = adSlots.reduce((sum, slot) => sum + slot.clicks, 0);
    const totalImpressions = adSlots.reduce((sum, slot) => sum + slot.impressions, 0);
    const activeAds = adSlots.filter(slot => slot.status === 'active').length;
    
    document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
    document.getElementById('totalClicks').textContent = totalClicks.toLocaleString();
    document.getElementById('totalImpressions').textContent = totalImpressions.toLocaleString();
    document.getElementById('activeAds').textContent = activeAds;
}

// 수익 차트 업데이트
function updateRevenueChart() {
    // 간단한 차트 시뮬레이션 (실제 구현에서는 Chart.js 등 사용)
    const chartElement = document.getElementById('revenue-chart');
    if (chartElement) {
        chartElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary);">수익 차트 (Chart.js 연동 필요)</div>';
    }
}

// 광고 관리 데이터 로드
function loadAdManagement() {
    const adGrid = document.getElementById('adManagementGrid');
    if (!adGrid) return;
    
    adGrid.innerHTML = '';
    
    adSlots.forEach(slot => {
        const adCard = createAdSlotCard(slot);
        adGrid.appendChild(adCard);
    });
}

// 광고 슬롯 카드 생성
function createAdSlotCard(slot) {
    const card = document.createElement('div');
    card.className = 'ad-slot-card';
    card.innerHTML = `
        <h3>${slot.name}</h3>
        <div class="ad-slot-status ${slot.status}">${slot.status === 'active' ? '활성' : '비활성'}</div>
        <p><strong>위치:</strong> ${slot.position}</p>
        <p><strong>크기:</strong> ${slot.size}</p>
        <p><strong>클릭:</strong> ${slot.clicks}</p>
        <p><strong>노출:</strong> ${slot.impressions.toLocaleString()}</p>
        <p><strong>수익:</strong> $${slot.revenue.toFixed(2)}</p>
        <div class="ad-slot-controls">
            <button class="btn-edit" onclick="editAdSlot(${slot.id})">편집</button>
            <button class="btn-toggle" onclick="toggleAdSlot(${slot.id})">${slot.status === 'active' ? '비활성화' : '활성화'}</button>
        </div>
    `;
    return card;
}

// 광고 슬롯 편집
function editAdSlot(slotId) {
    const slot = adSlots.find(s => s.id === slotId);
    if (!slot) return;
    
    // 모달에 데이터 채우기
    document.getElementById('editAdName').value = slot.name;
    document.getElementById('editAdPosition').value = slot.position;
    document.getElementById('editAdSize').value = slot.size;
    document.getElementById('editAdScript').value = slot.script;
    
    // 모달 표시
    document.getElementById('editAdModal').style.display = 'block';
    
    // 저장 버튼에 슬롯 ID 저장
    document.getElementById('saveAdBtn').dataset.slotId = slotId;
}

// 광고 슬롯 토글
function toggleAdSlot(slotId) {
    const slot = adSlots.find(s => s.id === slotId);
    if (!slot) return;
    
    slot.status = slot.status === 'active' ? 'inactive' : 'active';
    saveAdSlotsToStorage();
    loadAdManagement();
    updateStats();
}

// 새 광고 추가
function handleAddAd(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const newAd = {
        id: Date.now(), // 임시 ID
        name: formData.get('adName'),
        position: formData.get('adPosition'),
        size: formData.get('adSize'),
        script: formData.get('adScript'),
        status: 'inactive',
        clicks: 0,
        impressions: 0,
        revenue: 0
    };
    
    adSlots.push(newAd);
    saveAdSlotsToStorage();
    loadAdManagement();
    updateStats();
    
    // 폼 리셋
    e.target.reset();
    
    alert('새 광고가 추가되었습니다.');
}

// 광고 편집 저장
function saveAdEdit() {
    const slotId = parseInt(document.getElementById('saveAdBtn').dataset.slotId);
    const slot = adSlots.find(s => s.id === slotId);
    
    if (!slot) return;
    
    slot.name = document.getElementById('editAdName').value;
    slot.position = document.getElementById('editAdPosition').value;
    slot.size = document.getElementById('editAdSize').value;
    slot.script = document.getElementById('editAdScript').value;
    
    saveAdSlotsToStorage();
    closeEditModal();
    loadAdManagement();
    
    alert('광고가 수정되었습니다.');
}

// 편집 모달 닫기
function closeEditModal() {
    document.getElementById('editAdModal').style.display = 'none';
}

// 성과 데이터 로드
function loadPerformanceData() {
    const tableBody = document.querySelector('#performance-table tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    adSlots.forEach(slot => {
        const row = document.createElement('tr');
        const ctr = slot.impressions > 0 ? ((slot.clicks / slot.impressions) * 100).toFixed(2) : '0.00';
        const cpm = slot.impressions > 0 ? ((slot.revenue / slot.impressions) * 1000).toFixed(2) : '0.00';
        
        row.innerHTML = `
            <td>${slot.name}</td>
            <td>${slot.impressions.toLocaleString()}</td>
            <td>${slot.clicks}</td>
            <td>${ctr}%</td>
            <td>$${cpm}</td>
            <td>$${slot.revenue.toFixed(2)}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// 설정 로드
function loadSettings() {
    // 설정 데이터 로드 (실제 구현에서는 서버에서 가져옴)
    console.log('설정 페이지 로드됨');
    
    // 현재 계정 정보 표시
    const currentUsernameInput = document.getElementById('current-username');
    if (currentUsernameInput) {
        const currentUsername = localStorage.getItem('adminUsername') || 'admin';
        currentUsernameInput.value = currentUsername;
    }
}

// 설정 저장
function saveSettings(settingType) {
    switch(settingType) {
        case 'adsense':
            const publisherId = document.getElementById('publisherId').value;
            const autoAds = document.getElementById('autoAds').checked;
            
            // 실제 구현에서는 서버에 저장
            localStorage.setItem('adsenseSettings', JSON.stringify({
                publisherId,
                autoAds
            }));
            
            alert('AdSense 설정이 저장되었습니다.');
            break;
            
        case 'display':
            const adDensity = document.getElementById('adDensity').value;
            const mobileOptimization = document.getElementById('mobileOptimization').checked;
            
            localStorage.setItem('displaySettings', JSON.stringify({
                adDensity,
                mobileOptimization
            }));
            
            alert('표시 설정이 저장되었습니다.');
            break;
            
        case 'analytics':
            const trackingId = document.getElementById('trackingId').value;
            const enableReports = document.getElementById('enableReports').checked;
            
            localStorage.setItem('analyticsSettings', JSON.stringify({
                trackingId,
                enableReports
            }));
            
            alert('분석 설정이 저장되었습니다.');
            break;
    }
}

// 계정 정보 변경 처리
function handleChangeCredentials() {
    const currentPassword = document.getElementById('current-password').value;
    const newUsername = document.getElementById('new-username').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // 입력 검증
    if (!currentPassword) {
        alert('현재 비밀번호를 입력해주세요.');
        return;
    }
    
    // 현재 비밀번호 확인
    const storedPassword = localStorage.getItem('adminPassword') || 'admin123';
    if (currentPassword !== storedPassword) {
        alert('현재 비밀번호가 올바르지 않습니다.');
        return;
    }
    
    // 새 아이디 검증
    if (newUsername && newUsername.length < 3) {
        alert('새 아이디는 3자 이상이어야 합니다.');
        return;
    }
    
    // 새 비밀번호 검증
    if (newPassword) {
        if (newPassword.length < 6) {
            alert('새 비밀번호는 6자 이상이어야 합니다.');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            alert('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
            return;
        }
    }
    
    // 변경사항이 있는지 확인
    if (!newUsername && !newPassword) {
        alert('변경할 정보를 입력해주세요.');
        return;
    }
    
    // 확인 대화상자
    if (!confirm('계정 정보를 변경하시겠습니까?')) {
        return;
    }
    
    // 계정 정보 업데이트
    if (newUsername) {
        localStorage.setItem('adminUsername', newUsername);
        // 현재 아이디 필드 업데이트
        const currentUsernameInput = document.getElementById('current-username');
        if (currentUsernameInput) {
            currentUsernameInput.value = newUsername;
        }
    }
    
    if (newPassword) {
        localStorage.setItem('adminPassword', newPassword);
    }
    
    // 입력 필드 초기화
    document.getElementById('current-password').value = '';
    document.getElementById('new-username').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
    
    alert('계정 정보가 성공적으로 변경되었습니다.');
    
    // 보안을 위해 다시 로그인하도록 안내
    if (confirm('보안을 위해 다시 로그인하시겠습니까?')) {
        handleLogout();
    }
}

// 광고 스크립트 생성
function generateAdScript(position, size) {
    const publisherId = 'ca-pub-XXXXXXXXX'; // 실제 Publisher ID로 교체 필요
    const slotId = 'XXXXXXXXX'; // 실제 Slot ID로 교체 필요
    
    return `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="${publisherId}"
     data-ad-slot="${slotId}"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>`;
}

// 광고 슬롯 데이터를 로컬 스토리지에 저장
function saveAdSlotsToStorage() {
    localStorage.setItem('adSlots', JSON.stringify(adSlots));
}

// 위치별 광고 스크립트 데이터를 로컬 스토리지에 저장
function saveAdScriptsToStorage() {
    localStorage.setItem('adScripts', JSON.stringify(adScripts));
}

// 위치별 토글 스위치 처리
function handleTogglePosition(e) {
    const position = e.target.dataset.position;
    const isActive = e.target.checked;
    
    // 데이터 업데이트
    adScripts[position].active = isActive;
    saveAdScriptsToStorage();
    
    // 상태 텍스트 업데이트
    const statusText = e.target.closest('.position-controls').querySelector('.status-text');
    statusText.textContent = isActive ? '활성' : '비활성';
    statusText.style.color = isActive ? 'var(--accent-color)' : 'var(--text-secondary)';
    
    // 통계 업데이트
    updateStats();
    
    console.log(`${position} 광고가 ${isActive ? '활성화' : '비활성화'}되었습니다.`);
}

// 위치별 스크립트 저장 처리
function handleSaveScript(e) {
    const position = e.target.dataset.position;
    const textarea = document.getElementById(`${position}-script`);
    const script = textarea.value.trim();
    
    // 데이터 업데이트
    adScripts[position].script = script;
    saveAdScriptsToStorage();
    
    // 성공 메시지
    const originalText = e.target.textContent;
    e.target.textContent = '저장됨!';
    e.target.style.background = '#10b981';
    
    setTimeout(() => {
        e.target.textContent = originalText;
        e.target.style.background = 'var(--accent-color)';
    }, 2000);
    
    console.log(`${position} 광고 스크립트가 저장되었습니다.`);
}

// 위치별 광고 관리 초기화
function initializeAdPositionManagement() {
    // 저장된 데이터로 UI 초기화
    Object.keys(adScripts).forEach(position => {
        const data = adScripts[position];
        
        // 토글 스위치 상태 설정
        const toggle = document.getElementById(`${position}-toggle`);
        if (toggle) {
            toggle.checked = data.active;
        }
        
        // 상태 텍스트 설정
        const statusText = toggle?.closest('.position-controls')?.querySelector('.status-text');
        if (statusText) {
            statusText.textContent = data.active ? '활성' : '비활성';
            statusText.style.color = data.active ? 'var(--accent-color)' : 'var(--text-secondary)';
        }
        
        // 스크립트 텍스트 영역 설정
        const textarea = document.getElementById(`${position}-script`);
        if (textarea) {
            textarea.value = data.script;
        }
    });
}

// 전역 함수로 노출 (HTML에서 호출용)
// GitHub 배포 관리 함수들
function loadGitHubDeployment() {
    // 저장된 배포 상태 로드
    const savedStatus = localStorage.getItem('deploymentStatus');
    if (savedStatus) {
        deploymentStatus = JSON.parse(savedStatus);
    }
    updateDeploymentStatus();
    loadDeploymentLogs();
}

function updateDeploymentStatus() {
    // 배포 상태 업데이트
    const statusElements = {
        repository: document.getElementById('github-status'),
        lastDeploy: document.getElementById('last-deploy'),
        deployUrl: document.getElementById('deploy-url')
    };
    
    if (statusElements.repository) {
        statusElements.repository.textContent = deploymentStatus.repository || '연결 필요';
        statusElements.repository.className = `status-value ${deploymentStatus.connected ? 'connected' : 'disconnected'}`;
    }
    
    if (statusElements.lastDeploy) {
        statusElements.lastDeploy.textContent = deploymentStatus.lastDeploy ? 
            new Date(deploymentStatus.lastDeploy).toLocaleString() : '아직 배포 안함';
    }
    
    if (statusElements.deployUrl) {
        statusElements.deployUrl.textContent = deploymentStatus.deployUrl || '배포 후 생성됨';
    }
}

function connectGitHub() {
    // 사용자가 지정한 저장소로 자동 설정
    const repoName = 'jshi3352/time';
    
    deploymentStatus.repository = repoName;
    deploymentStatus.connected = true;
    deploymentStatus.deployUrl = `https://${repoName.split('/')[0]}.github.io/${repoName.split('/')[1]}`;
    
    localStorage.setItem('deploymentStatus', JSON.stringify(deploymentStatus));
    updateDeploymentStatus();
    addDeploymentLog('GitHub 저장소 연결됨: ' + repoName, 'success');
    addDeploymentLog('테스트 배포용 저장소가 설정되었습니다.', 'info');
}

function deployToGitHub() {
    if (!deploymentStatus.connected) {
        alert('먼저 GitHub 저장소를 연결해주세요.');
        return;
    }
    
    addDeploymentLog('📋 배포 가이드 시작', 'info');
    addDeploymentLog('', 'info');
    addDeploymentLog('🔸 1단계: 저장소 확인', 'info');
    addDeploymentLog('   - 기존 jshi3352/time 저장소가 열립니다', 'info');
    addDeploymentLog('   - 저장소가 없다면 위의 링크로 새로 생성', 'info');
    addDeploymentLog('', 'info');
    addDeploymentLog('🔸 2단계: 파일 업로드/업데이트', 'info');
    addDeploymentLog('   - 기존 파일이 있다면 업데이트', 'info');
    addDeploymentLog('   - 새 파일은 드래그&드롭 또는 "Add file" > "Upload files"', 'info');
    addDeploymentLog('   - 모든 파일 업로드 후 "Commit changes" 클릭', 'info');
    addDeploymentLog('', 'info');
    addDeploymentLog('🔸 3단계: GitHub Pages 확인/활성화', 'info');
    addDeploymentLog('   - Settings 탭 > Pages 메뉴', 'info');
    addDeploymentLog('   - 이미 활성화되어 있다면 자동 배포됩니다', 'info');
    addDeploymentLog('   - 비활성화 상태라면 Source: Deploy from a branch 설정', 'info');
    addDeploymentLog('', 'info');
    addDeploymentLog('⏰ 파일 업데이트 후 1-2분 내 반영됩니다', 'info');
    
    // 기존 저장소가 있다면 해당 저장소로, 없다면 생성 페이지로
    const repoUrl = 'https://github.com/jshi3352/time';
    const createRepoUrl = 'https://github.com/new';
    
    // 먼저 기존 저장소 확인을 위해 저장소 페이지를 열어봄
    addDeploymentLog('🔍 기존 저장소 확인 중...', 'info');
    window.open(repoUrl, '_blank');
    
    // 저장소가 없을 경우를 대비해 생성 페이지 링크도 제공
    addDeploymentLog('📝 저장소가 없다면 새로 생성하세요:', 'info');
    addDeploymentLog('   👉 https://github.com/new', 'info');
    
    // 시뮬레이션된 배포 프로세스
    setTimeout(() => {
        deploymentStatus.lastDeploy = Date.now();
        localStorage.setItem('deploymentStatus', JSON.stringify(deploymentStatus));
        updateDeploymentStatus();
        addDeploymentLog('✅ 배포 가이드 완료!', 'success');
        addDeploymentLog(`🌐 배포 예정 URL: ${deploymentStatus.deployUrl}`, 'success');
    }, 1000);
}

function openDeployUrl() {
    if (deploymentStatus.deployUrl) {
        window.open(deploymentStatus.deployUrl, '_blank');
    } else {
        alert('배포 URL이 설정되지 않았습니다.');
    }
}

function showFileUploadHelper() {
    alert('파일 업로드 도우미 함수가 호출되었습니다!');
    addDeploymentLog('📁 파일 업로드 도우미', 'info');
    addDeploymentLog('', 'info');
    addDeploymentLog('💡 GitHub에 파일을 업로드하는 방법:', 'info');
    addDeploymentLog('', 'info');
    addDeploymentLog('방법 1: 드래그 & 드롭', 'info');
    addDeploymentLog('   1. 현재 폴더의 모든 파일 선택 (Ctrl+A)', 'info');
    addDeploymentLog('   2. GitHub 저장소 페이지로 드래그', 'info');
    addDeploymentLog('   3. "Commit changes" 버튼 클릭', 'info');
    addDeploymentLog('', 'info');
    addDeploymentLog('방법 2: Upload files 버튼', 'info');
    addDeploymentLog('   1. GitHub 저장소에서 "Add file" > "Upload files" 클릭', 'info');
    addDeploymentLog('   2. "choose your files" 클릭하여 파일 선택', 'info');
    addDeploymentLog('   3. 모든 파일 선택 후 업로드', 'info');
    addDeploymentLog('', 'info');
    addDeploymentLog('⚠️  주의사항:', 'info');
    addDeploymentLog('   - 폴더 구조를 유지해야 합니다', 'info');
    addDeploymentLog('   - index.html이 루트에 있어야 합니다', 'info');
    addDeploymentLog('   - css/, js/, icons/ 폴더도 함께 업로드', 'info');
    addDeploymentLog('', 'info');
    
    // 현재 폴더 열기 안내
    if (confirm('현재 폴더를 Windows 탐색기에서 열까요?')) {
        addDeploymentLog('💻 폴더 열기 방법:', 'info');
        addDeploymentLog('', 'info');
        addDeploymentLog('방법 1: 키보드 단축키', 'success');
        addDeploymentLog('   1. Win + R 키를 누르세요', 'success');
        addDeploymentLog('   2. 실행창에서 점(.) 하나만 입력', 'success');
        addDeploymentLog('   3. Enter 키를 누르면 현재 폴더가 열립니다', 'success');
        addDeploymentLog('', 'info');
        addDeploymentLog('방법 2: 파일 탐색기', 'success');
        addDeploymentLog('   1. 작업표시줄의 폴더 아이콘 클릭', 'success');
        addDeploymentLog('   2. 주소창에 다음 경로 입력:', 'success');
        addDeploymentLog('   C:\\Users\\jshi5\\Saved Games', 'success');
        addDeploymentLog('', 'info');
        addDeploymentLog('📂 폴더가 열리면 모든 파일을 선택하여', 'info');
        addDeploymentLog('   GitHub 저장소에 업로드하세요!', 'info');
    }
}

function addDeploymentLog(message, type = 'info') {
    const logContainer = document.getElementById('deploy-log');
    if (logContainer) {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }
}

function loadDeploymentLogs() {
    const logContainer = document.getElementById('deploy-log');
    if (logContainer) {
        logContainer.innerHTML = '<div class="log-empty">배포 로그가 여기에 표시됩니다.</div>';
    }
}

// 데이터베이스 관리 함수들
function loadDatabaseManagement() {
    updateDatabaseStatus();
    loadUserStats();
}

function updateDatabaseStatus() {
    const statusElements = {
        connection: document.getElementById('db-connection-status'),
        projectUrl: document.getElementById('supabase-url-status'),
        lastBackup: document.getElementById('last-backup-status')
    };
    
    // Supabase 연결 상태 확인
    const isSupabaseConnected = window.supabase && window.supabaseConfig;
    dbStatus.connected = isSupabaseConnected;
    
    if (statusElements.connection) {
        statusElements.connection.textContent = dbStatus.connected ? '연결됨' : '연결되지 않음';
        statusElements.connection.className = `status-value ${dbStatus.connected ? 'connected' : 'disconnected'}`;
    }
    
    if (statusElements.projectUrl) {
        statusElements.projectUrl.textContent = window.supabaseConfig?.url || '설정되지 않음';
    }
    
    if (statusElements.lastBackup) {
        statusElements.lastBackup.textContent = dbStatus.lastBackup ? 
            new Date(dbStatus.lastBackup).toLocaleString() : '백업 기록 없음';
    }
}

function loadUserStats() {
    const userCountElement = document.getElementById('user-count');
    const activeUsersElement = document.getElementById('active-users');
    const totalRecordsElement = document.getElementById('total-records');
    
    if (window.supabase && dbStatus.connected) {
        // 실제 사용자 통계 로드
        loadSupabaseUserStats();
    } else {
        // 기본값 표시
        if (userCountElement) userCountElement.textContent = '0';
        if (activeUsersElement) activeUsersElement.textContent = '0';
        if (totalRecordsElement) totalRecordsElement.textContent = '0';
    }
}

async function loadSupabaseUserStats() {
    try {
        // 사용자 수 조회
        const { count: userCount } = await window.supabase
            .from('user_settings')
            .select('*', { count: 'exact', head: true });
        
        // 작업 기록 수 조회
        const { count: recordCount } = await window.supabase
            .from('work_records')
            .select('*', { count: 'exact', head: true });
        
        // 활성 사용자 수 (최근 7일)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { count: activeUsers } = await window.supabase
            .from('work_records')
            .select('user_id', { count: 'exact', head: true })
            .gte('created_at', sevenDaysAgo.toISOString());
        
        // UI 업데이트
        const userCountElement = document.getElementById('user-count');
        const activeUsersElement = document.getElementById('active-users');
        const totalRecordsElement = document.getElementById('total-records');
        
        if (userCountElement) userCountElement.textContent = userCount || 0;
        if (activeUsersElement) activeUsersElement.textContent = activeUsers || 0;
        if (totalRecordsElement) totalRecordsElement.textContent = recordCount || 0;
        
    } catch (error) {
        console.error('사용자 통계 로드 실패:', error);
    }
}

function testSupabaseConnection() {
    if (!window.supabase) {
        alert('Supabase가 설정되지 않았습니다.');
        return;
    }
    
    // 간단한 연결 테스트
    window.supabase
        .from('user_settings')
        .select('count')
        .limit(1)
        .then(({ data, error }) => {
            if (error) {
                alert('Supabase 연결 실패: ' + error.message);
            } else {
                alert('Supabase 연결 성공!');
                updateDatabaseStatus();
            }
        });
}

function backupDatabase() {
    if (!dbStatus.connected) {
        alert('먼저 데이터베이스에 연결해주세요.');
        return;
    }
    
    // 백업 시뮬레이션
    const confirmBackup = confirm('데이터베이스를 백업하시겠습니까?');
    if (confirmBackup) {
        dbStatus.lastBackup = Date.now();
        localStorage.setItem('dbStatus', JSON.stringify(dbStatus));
        updateDatabaseStatus();
        alert('데이터베이스 백업이 완료되었습니다.');
    }
}

function exportUserData() {
    if (!window.supabase || !dbStatus.connected) {
        alert('Supabase에 연결되지 않았습니다.');
        return;
    }
    
    // 사용자 데이터 내보내기
    window.supabase
        .from('user_settings')
        .select('*')
        .then(({ data, error }) => {
            if (error) {
                alert('데이터 내보내기 실패: ' + error.message);
            } else {
                const dataStr = JSON.stringify(data, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `user_data_${new Date().toISOString().split('T')[0]}.json`;
                link.click();
                URL.revokeObjectURL(url);
            }
        });
}

// 초기화 시 저장된 상태 로드
function loadStoredStatus() {
    const storedDeployment = localStorage.getItem('deploymentStatus');
    if (storedDeployment) {
        deploymentStatus = { ...deploymentStatus, ...JSON.parse(storedDeployment) };
    }
    
    const storedDb = localStorage.getItem('dbStatus');
    if (storedDb) {
        dbStatus = { ...dbStatus, ...JSON.parse(storedDb) };
    }
}

// 페이지 로드 시 상태 복원
document.addEventListener('DOMContentLoaded', function() {
    loadStoredStatus();
});

// 전역 함수 노출
window.editAdSlot = editAdSlot;
window.toggleAdSlot = toggleAdSlot;
window.saveAdEdit = saveAdEdit;
window.saveSettings = saveSettings;
window.connectGitHub = connectGitHub;
window.deployToGitHub = deployToGitHub;
window.openDeployUrl = openDeployUrl;
window.showFileUploadHelper = showFileUploadHelper;
window.testSupabaseConnection = testSupabaseConnection;
window.backupDatabase = backupDatabase;
window.exportUserData = exportUserData;