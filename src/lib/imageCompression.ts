/**
 * Comprime e redimensiona uma imagem, convertendo para WebP.
 * Suporta JPG, PNG e HEIC (iPhone).
 */
export async function compressImage(
  file: File, 
  maxWidth: number = 1200, 
  maxHeight: number = 1200
): Promise<File> {
  // Verificação de segurança para ambiente de servidor
  if (typeof window === 'undefined') return file;

  let blob: Blob = file;

  // 1. Lidar com HEIC do iPhone
  const isHEIC = file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif") || file.type === "image/heic" || file.type === "image/heif";
  
  if (isHEIC) {
    try {
      // Import dinâmico para evitar erro de SSR (window is not defined)
      const heic2any = (await import("heic2any")).default;
      
      const converted = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.8
      });
      blob = Array.isArray(converted) ? converted[0] : converted;
    } catch (error) {
      console.error("Erro ao converter HEIC:", error);
    }
  }

  // 2. Redimensionar e converter para WebP usando Canvas
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Manter proporção
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Não foi possível criar contexto 2D"));
        
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (resultBlob) => {
            if (resultBlob) {
              // Criar um novo arquivo .webp
              const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
              const compressedFile = new File([resultBlob], newFileName, {
                type: "image/webp",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error("Erro na conversão para Blob"));
            }
          },
          "image/webp",
          0.85 // Qualidade
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
