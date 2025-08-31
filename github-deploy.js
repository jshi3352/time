/**
 * GitHub 자동 배포 스크립트
 * 이 스크립트는 GitHub API를 사용하여 저장소를 생성하고 코드를 업로드합니다.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

class GitHubDeployer {
    constructor(token, username) {
        this.token = token;
        this.username = username;
        this.apiBase = 'api.github.com';
    }

    // GitHub API 요청 함수
    makeRequest(method, endpoint, data = null) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: this.apiBase,
                path: endpoint,
                method: method,
                headers: {
                    'Authorization': `token ${this.token}`,
                    'User-Agent': 'GitHub-Auto-Deploy',
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                }
            };

            const req = https.request(options, (res) => {
                let responseData = '';
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(responseData);
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(parsed);
                        } else {
                            reject(new Error(`API Error: ${res.statusCode} - ${parsed.message}`));
                        }
                    } catch (e) {
                        reject(new Error(`Parse Error: ${e.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (data) {
                req.write(JSON.stringify(data));
            }
            req.end();
        });
    }

    // 저장소 생성
    async createRepository(repoName, description = '', isPrivate = false) {
        console.log(`📦 저장소 '${repoName}' 생성 중...`);
        
        const repoData = {
            name: repoName,
            description: description,
            private: isPrivate,
            auto_init: true
        };

        try {
            const result = await this.makeRequest('POST', '/user/repos', repoData);
            console.log(`✅ 저장소 생성 완료: ${result.html_url}`);
            return result;
        } catch (error) {
            if (error.message.includes('422')) {
                console.log(`⚠️  저장소 '${repoName}'이 이미 존재합니다.`);
                return await this.getRepository(repoName);
            }
            throw error;
        }
    }

    // 저장소 정보 가져오기
    async getRepository(repoName) {
        return await this.makeRequest('GET', `/repos/${this.username}/${repoName}`);
    }

    // 파일을 Base64로 인코딩
    encodeFileToBase64(filePath) {
        const fileContent = fs.readFileSync(filePath);
        return fileContent.toString('base64');
    }

    // 파일 업로드
    async uploadFile(repoName, filePath, content, commitMessage = 'Add file') {
        const encodedContent = Buffer.from(content, 'utf8').toString('base64');
        
        const fileData = {
            message: commitMessage,
            content: encodedContent
        };

        try {
            const result = await this.makeRequest(
                'PUT', 
                `/repos/${this.username}/${repoName}/contents/${filePath}`, 
                fileData
            );
            return result;
        } catch (error) {
            if (error.message.includes('422')) {
                // 파일이 이미 존재하는 경우 업데이트
                return await this.updateFile(repoName, filePath, content, commitMessage);
            }
            throw error;
        }
    }

    // 파일 업데이트
    async updateFile(repoName, filePath, content, commitMessage = 'Update file') {
        // 기존 파일 정보 가져오기
        const existingFile = await this.makeRequest(
            'GET', 
            `/repos/${this.username}/${repoName}/contents/${filePath}`
        );

        const encodedContent = Buffer.from(content, 'utf8').toString('base64');
        
        const fileData = {
            message: commitMessage,
            content: encodedContent,
            sha: existingFile.sha
        };

        return await this.makeRequest(
            'PUT', 
            `/repos/${this.username}/${repoName}/contents/${filePath}`, 
            fileData
        );
    }

    // 디렉토리의 모든 파일 업로드
    async uploadDirectory(repoName, localDir, remoteDir = '') {
        const files = this.getAllFiles(localDir);
        const uploadPromises = [];

        for (const file of files) {
            const relativePath = path.relative(localDir, file);
            const remotePath = remoteDir ? `${remoteDir}/${relativePath}` : relativePath;
            const content = fs.readFileSync(file, 'utf8');
            
            console.log(`📤 업로드 중: ${remotePath}`);
            
            uploadPromises.push(
                this.uploadFile(repoName, remotePath.replace(/\\/g, '/'), content, `Add ${relativePath}`)
                    .then(() => console.log(`✅ 업로드 완료: ${remotePath}`))
                    .catch(error => console.error(`❌ 업로드 실패: ${remotePath} - ${error.message}`))
            );
        }

        await Promise.all(uploadPromises);
    }

    // 디렉토리의 모든 파일 목록 가져오기
    getAllFiles(dir, fileList = []) {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                // 특정 디렉토리 제외
                if (!['node_modules', '.git', '.vscode'].includes(file)) {
                    this.getAllFiles(filePath, fileList);
                }
            } else {
                // 특정 파일 제외
                if (!file.startsWith('.') && file !== 'desktop.ini') {
                    fileList.push(filePath);
                }
            }
        });
        
        return fileList;
    }

    // 전체 프로젝트 배포
    async deployProject(repoName, description = '공수달력 웹사이트', isPrivate = false) {
        try {
            console.log('🚀 GitHub 배포 시작...');
            
            // 1. 저장소 생성
            await this.createRepository(repoName, description, isPrivate);
            
            // 2. 현재 디렉토리의 모든 파일 업로드
            await this.uploadDirectory(repoName, process.cwd());
            
            console.log('🎉 배포 완료!');
            console.log(`🔗 저장소 URL: https://github.com/${this.username}/${repoName}`);
            console.log(`🌐 GitHub Pages URL: https://${this.username}.github.io/${repoName}`);
            
        } catch (error) {
            console.error('❌ 배포 실패:', error.message);
            throw error;
        }
    }
}

// 사용 예제
async function main() {
    // GitHub Personal Access Token과 사용자명을 설정하세요
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'your_github_token_here';
    const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'your_username_here';
    
    if (GITHUB_TOKEN === 'your_github_token_here' || GITHUB_USERNAME === 'your_username_here') {
        console.error('❌ GitHub 토큰과 사용자명을 설정해주세요!');
        console.log('\n📝 설정 방법:');
        console.log('1. GitHub에서 Personal Access Token 생성');
        console.log('2. 환경변수 설정: set GITHUB_TOKEN=your_token');
        console.log('3. 환경변수 설정: set GITHUB_USERNAME=your_username');
        console.log('4. 또는 코드에서 직접 수정');
        return;
    }
    
    const deployer = new GitHubDeployer(GITHUB_TOKEN, GITHUB_USERNAME);
    
    try {
        await deployer.deployProject('gongsudal-calendar', '공수달력 - 한국의 공휴일과 달력을 제공하는 웹사이트');
    } catch (error) {
        console.error('배포 중 오류 발생:', error.message);
    }
}

// 스크립트가 직접 실행될 때만 main 함수 호출
if (require.main === module) {
    main();
}

module.exports = GitHubDeployer;