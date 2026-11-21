# 웹툰 이미지 수신 서버 (개발용)

Cloudflare Worker + R2로 이미지 업로드/조회 및 MCP HTTP 엔드포인트를 제공합니다.

## 준비
1. Cloudflare에서 R2 버킷 생성 (요금/무료 제공량은 Cloudflare에서 확인).
2. Worker 생성 후 이 폴더의 worker.js를 배포.
3. Worker 설정에서 R2 binding 이름을 **IMAGES**로 지정하고 버킷 연결.
4. Worker secret **INBOX_TOKEN**을 길고 무작위한 값으로 설정. 절대로 GitHub에 올리지 마세요.
5. Worker 주소 `https://<worker>.workers.dev` 확인.

## API
- `GET /health`
- `GET /images` 이미지 목록
- `GET /images/<key>` 이미지 다운로드
- `POST /images` JSON `{name,kind,part?,content_type,image_base64}`
- `POST /mcp` MCP JSON-RPC: initialize, tools/list, tools/call

모든 요청에 `Authorization: Bearer <INBOX_TOKEN>` 필요.
파일 최대 8MB, PNG/JPEG/WebP만 허용. **이 프로토타입은 인증/호환성 테스트가 필요하며 배포 완료 상태가 아닙니다.**

## 제한
ChatGPT가 생성한 이미지를 자동으로 MCP 인자로 넘길 수 있는지는 ChatGPT 연결 환경에 따라 다릅니다. 이 서버만 배포한다고 자동 업로드가 완성되지는 않습니다.
클라이언트에서는 토큰을 sessionStorage에만 보관하고, 다른 사람에게 공개된 컴퓨터에서는 사용하지 마세요.
