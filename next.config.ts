import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // '프로젝트'를 '스페이스'로 바꾸면서 주소도 /spaces로 옮겼다. 예전 링크는 새 주소로 보낸다
  async redirects() {
    return [
      { source: "/projects", destination: "/spaces", permanent: true },
      { source: "/projects/:id", destination: "/spaces/:id", permanent: true },
    ];
  },
};

export default nextConfig;
