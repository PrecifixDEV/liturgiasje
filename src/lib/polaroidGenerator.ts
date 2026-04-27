import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Gera um Blob de imagem estilo Polaroid Wide (Horizontal)
 */
export async function generatePolaroidBlob(
  photoUrl: string,
  date: string,
  time: string,
  readers: string[]
): Promise<Blob> {
  const width = 1350;
  const height = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Não foi possível obter o contexto do canvas");

  // 1. Fundo Branco (Moldura)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // 2. Carregar a Foto do Usuário
  const img = new Image();
  img.crossOrigin = "anonymous"; // Necessário para evitar erro de CORS ao usar Canvas
  img.src = photoUrl;

  return new Promise((resolve, reject) => {
    img.onload = async () => {
      // Cálculo de proporções para a foto
      // Deixamos margens: 40px laterais/topo e ~180px embaixo para o texto
      const padding = 50;
      const bottomPadding = 180;
      
      const photoAreaWidth = width - (padding * 2);
      const photoAreaHeight = height - padding - bottomPadding;

      // Desenhar a foto com "object-fit: cover" no canvas
      const imgRatio = img.width / img.height;
      const areaRatio = photoAreaWidth / photoAreaHeight;
      
      let drawWidth, drawHeight, offsetX, offsetY;
      
      if (imgRatio > areaRatio) {
        drawHeight = photoAreaHeight;
        drawWidth = photoAreaHeight * imgRatio;
        offsetX = padding - (drawWidth - photoAreaWidth) / 2;
        offsetY = padding;
      } else {
        drawWidth = photoAreaWidth;
        drawHeight = photoAreaWidth / imgRatio;
        offsetX = padding;
        offsetY = padding - (drawHeight - photoAreaHeight) / 2;
      }

      // Clip para a área da foto
      ctx.save();
      ctx.beginPath();
      ctx.rect(padding, padding, photoAreaWidth, photoAreaHeight);
      ctx.clip();
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      ctx.restore();

      // Sombra leve na foto para profundidade
      ctx.strokeStyle = "rgba(0,0,0,0.05)";
      ctx.strokeRect(padding, padding, photoAreaWidth, photoAreaHeight);

      // 3. Desenhar Textos (Aguardar fonte carregar se possível)
      // Usamos Gochi Hand como prioridade, fallback para cursiva
      ctx.fillStyle = "#4e342e";
      ctx.textBaseline = "middle";

      const formattedDate = format(parseISO(date), "dd 'de' MMMM", { locale: ptBR });
      const firstNames = readers.map(n => n.split(' ')[0]).join(', ');

      // Data e Hora (Esquerda)
      ctx.font = "42px 'Gochi Hand', cursive";
      ctx.textAlign = "left";
      ctx.fillText(`${formattedDate} - ${time.substring(0, 5)}`, padding + 10, height - (bottomPadding / 2) - 15);

      // Leitores (Direita/Centro)
      ctx.font = "38px 'Gochi Hand', cursive";
      ctx.fillStyle = "#78716c"; // stone-500
      ctx.textAlign = "right";
      ctx.fillText(firstNames, width - padding - 10, height - (bottomPadding / 2) - 15);

      // Converter para Blob
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Erro ao gerar Blob da Polaroid"));
        },
        "image/jpeg",
        0.92
      );
    };

    img.onerror = (err) => reject(new Error("Erro ao carrergar imagem para a Polaroid"));
  });
}
