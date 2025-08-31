# 🚀 GitHub 자동 배포 가이드

이 가이드는 `github-deploy.js` 스크립트를 사용하여 프로젝트를 GitHub에 자동으로 배포하는 방법을 설명합니다.

## 📋 사전 준비사항

### 1. Node.js 설치 확인
```powershell
node --version
npm --version
```

### 2. GitHub Personal Access Token 생성

1. **GitHub 로그인** → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. **Generate new token (classic)** 클릭
3. **토큰 이름** 입력 (예: "Auto Deploy Token")
4. **권한 선택**:
   - ✅ `repo` (전체 저장소 접근)
   - ✅ `workflow` (GitHub Actions)
   - ✅ `write:packages` (패키지 쓰기)
5. **Generate token** 클릭
6. **⚠️ 중요**: 생성된 토큰을 안전한 곳에 복사해두세요!

## 🔧 설정 방법

### 방법 1: 환경변수 사용 (권장)

```powershell
# PowerShell에서 환경변수 설정
$env:GITHUB_TOKEN = "your_github_token_here"
$env:GITHUB_USERNAME = "your_github_username"

# 설정 확인
echo $env:GITHUB_TOKEN
echo $env:GITHUB_USERNAME
```

### 방법 2: 코드에서 직접 수정

`github-deploy.js` 파일의 다음 부분을 수정:

```javascript
const GITHUB_TOKEN = 'ghp_your_actual_token_here';
const GITHUB_USERNAME = 'your_actual_username';
```

## 🚀 사용 방법

### 1. 스크립트 실행

```powershell
# 현재 프로젝트 디렉토리에서 실행
node github-deploy.js
```

### 2. 실행 과정

1. **저장소 생성**: `gongsudal-calendar` 이름으로 GitHub 저장소 생성
2. **파일 업로드**: 현재 디렉토리의 모든 파일을 GitHub에 업로드
3. **완료 메시지**: 저장소 URL과 GitHub Pages URL 표시

## 📁 업로드되는 파일들

- ✅ `index.html`, `admin.html`
- ✅ `css/` 폴더 (모든 CSS 파일)
- ✅ `js/` 폴더 (모든 JavaScript 파일)
- ✅ `icons/` 폴더 (아이콘 파일들)
- ✅ `manifest.json`, `sw.js`
- ✅ `privacy-policy.html`, `terms-of-service.html`
- ✅ `robots.txt`, `sitemap.xml`, `ads.txt`

### 제외되는 파일들

- ❌ `node_modules/` 폴더
- ❌ `.git/` 폴더
- ❌ `.vscode/` 폴더
- ❌ `desktop.ini`
- ❌ 숨김 파일 (`.`으로 시작하는 파일)

## 🌐 GitHub Pages 설정

배포 완료 후 GitHub Pages를 활성화하려면:

1. **GitHub 저장소** → **Settings** → **Pages**
2. **Source**: Deploy from a branch
3. **Branch**: main
4. **Folder**: / (root)
5. **Save** 클릭

몇 분 후 `https://your_username.github.io/gongsudal-calendar`에서 웹사이트에 접근할 수 있습니다.

## 🔄 업데이트 방법

코드를 수정한 후 다시 배포하려면:

```powershell
node github-deploy.js
```

스크립트가 자동으로 변경된 파일들을 감지하고 업데이트합니다.

## 🛠️ 고급 사용법

### 커스텀 저장소 이름으로 배포

```javascript
const GitHubDeployer = require('./github-deploy.js');

async function customDeploy() {
    const deployer = new GitHubDeployer(process.env.GITHUB_TOKEN, process.env.GITHUB_USERNAME);
    await deployer.deployProject('my-custom-repo-name', '커스텀 설명');
}

customDeploy();
```

### 개별 파일 업로드

```javascript
const deployer = new GitHubDeployer(token, username);
await deployer.uploadFile('repo-name', 'path/to/file.html', fileContent, 'Update file');
```

## ❗ 주의사항

1. **토큰 보안**: GitHub 토큰을 코드에 직접 포함하지 마세요
2. **저장소 이름**: 이미 존재하는 저장소 이름을 사용하면 파일이 업데이트됩니다
3. **파일 크기**: GitHub는 파일당 100MB 제한이 있습니다
4. **API 제한**: GitHub API는 시간당 5000회 요청 제한이 있습니다

## 🆘 문제 해결

### "API Error: 401" 오류
- GitHub 토큰이 올바르지 않거나 만료되었습니다
- 새 토큰을 생성하고 다시 설정하세요

### "API Error: 403" 오류
- 토큰 권한이 부족합니다
- 토큰 생성 시 `repo` 권한을 체크했는지 확인하세요

### "Parse Error" 오류
- 네트워크 연결을 확인하세요
- GitHub 서비스 상태를 확인하세요

## 📞 지원

문제가 발생하면 다음을 확인해보세요:

1. Node.js 버전 (v14 이상 권장)
2. GitHub 토큰 권한
3. 네트워크 연결 상태
4. GitHub 서비스 상태

---

**🎉 성공적인 배포를 위해 이 가이드를 따라해보세요!**