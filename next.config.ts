import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit -> fontkit, eski bir @swc/helpers export adı (applyDecoratedDescriptor)
  // kullanıyor; Turbopack'in bundle ettiği sürümde bu export yok. Native Node
  // require'a bırakmak (bundle dışına almak) derleme hatasını çözüyor.
  serverExternalPackages: ["pdfkit", "fontkit"],
};

export default nextConfig;
