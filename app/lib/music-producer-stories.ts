/**
 * Histórias exibidas abaixo de cada demo no /musicproducer.
 *
 * Prioridade:
 * 1. Arquivo .txt no Google Drive com o mesmo nome da faixa (ex.: "Jingle Comercial.txt")
 * 2. Entrada neste arquivo (chave "Categoria/Nome" ou só "Nome")
 *
 * Exemplo de estrutura no Drive:
 *   Pasta "Publicidade"
 *     Jingle Comercial.mp3
 *     Jingle Comercial.txt
 */
export const musicProducerStoryFallback: Record<string, string> = {
  "Publicidade/Jingle Comercial":
    "Jingle criado para reforçar a identidade de uma marca local, com vocal marcante e arranjo moderno pensado para rádio e redes sociais.",
  "Publicidade/Jingle Político":
    "Produção enérgica para campanha eleitoral, com mensagem clara, ritmo envolvente e vocal que transmite credibilidade.",
  "Personalizada/Música de Aniversário":
    "Música personalizada com letra sob medida, celebrando momentos especiais com clima emocionante e leve.",
  "Sertanejo/Sertanejo Personalizado":
    "Composição sertaneja romântica, com violão, sanfona e letra feita para homenagear alguém especial.",
  "Eletrônica/Electronic Demo":
    "Demo eletrônica com drops impactantes, ideal para eventos, academias e conteúdo digital.",
  "Funk/Funk Personalizado":
    "Produção funk carioteira com batida dançante e letra personalizada para festas e redes.",
  "Casamento/Música para Casamento":
    "Trilha emocionante para entrada ou homenagem no altar, com arranjo delicado e vocal acolhedor.",
  "Infantil/Música Infantil":
    "Canção lúdica e educativa, com melodia fácil de cantar e letra divertida para crianças.",
  "DJ/Vinheta Intro DJ":
    "Vinheta curta e impactante para abrir sets, com efeitos, vocal processado e identidade sonora forte.",
};

export function resolveMusicProducerStory(
  folderName: string,
  fileBaseName: string,
  driveStory: string | null,
): string | null {
  if (driveStory?.trim()) return driveStory.trim();

  const normalizedBase = fileBaseName.trim();
  return (
    musicProducerStoryFallback[`${folderName}/${normalizedBase}`] ??
    musicProducerStoryFallback[normalizedBase] ??
    null
  );
}
