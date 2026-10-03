interface Palette {
  name: string;
  dark: string;
  middle: string;
  deep: string;
  glow: string;
  accent: string;
}

export interface GameBackground {
  id: number;
  name: string;
  image: string;
}

const palettes: Palette[] = [
  { name: 'Jade', dark: '#071f21', middle: '#123d3b', deep: '#071719', glow: '#4fe0c8', accent: '#8abb78' },
  { name: 'Rubi', dark: '#250f1e', middle: '#4b1d33', deep: '#160d18', glow: '#ff6a82', accent: '#f4b1a5' },
  { name: 'Safira', dark: '#09182e', middle: '#152f50', deep: '#07111f', glow: '#56c9e3', accent: '#819bff' },
  { name: 'Aureo', dark: '#20190d', middle: '#47351a', deep: '#100e0a', glow: '#f2c14e', accent: '#ef8b53' },
  { name: 'Coral', dark: '#21121a', middle: '#532637', deep: '#130e14', glow: '#ff9a87', accent: '#f16b76' },
  { name: 'Prata', dark: '#131b24', middle: '#344452', deep: '#0c121a', glow: '#bed7e3', accent: '#7ea7b2' },
  { name: 'Bambu', dark: '#0d211b', middle: '#24432c', deep: '#09150f', glow: '#bbd978', accent: '#51b887' },
  { name: 'Ametista', dark: '#1d142a', middle: '#3b2750', deep: '#100e1a', glow: '#c6a4fa', accent: '#fb92ca' },
  { name: 'Oceano', dark: '#091d26', middle: '#174454', deep: '#071219', glow: '#46d4c8', accent: '#63a9ff' },
  { name: 'Brasa', dark: '#27120f', middle: '#5a241d', deep: '#130c0b', glow: '#ff9b54', accent: '#ff5d63' },
];

const designs = [
  { name: 'Aurora', image: (p: Palette) => `radial-gradient(ellipse at 16% 12%,${p.glow}77 0,transparent 36%),linear-gradient(145deg,${p.dark},${p.middle} 58%,${p.deep})` },
  { name: 'Jardim', image: (p: Palette) => `radial-gradient(circle at 84% 18%,${p.glow}66 0 8%,transparent 35%),radial-gradient(circle at 12% 82%,${p.accent}55 0,transparent 42%),linear-gradient(25deg,${p.deep},${p.dark} 48%,${p.middle})` },
  { name: 'Celeste', image: (p: Palette) => `repeating-linear-gradient(135deg,${p.glow}12 0 1px,transparent 1px 22px),radial-gradient(ellipse at 50% 0%,${p.accent}66,transparent 55%),linear-gradient(180deg,${p.deep},${p.dark})` },
  { name: 'Lago', image: (p: Palette) => `radial-gradient(ellipse at 50% 120%,${p.glow}77,transparent 55%),radial-gradient(ellipse at 0% 0%,${p.accent}44,transparent 35%),linear-gradient(125deg,${p.dark},${p.deep})` },
  { name: 'Ondas', image: (p: Palette) => `repeating-radial-gradient(ellipse at 85% 10%,${p.glow}16 0 2px,transparent 2px 18px),linear-gradient(135deg,${p.middle},${p.deep} 68%)` },
  { name: 'Constelacao', image: (p: Palette) => `radial-gradient(circle at 25% 30%,${p.accent}66 0 2%,transparent 18%),radial-gradient(circle at 80% 75%,${p.glow}55 0 2%,transparent 20%),linear-gradient(120deg,${p.dark},${p.middle},${p.deep})` },
];

export const GAME_BACKGROUNDS: GameBackground[] = palettes.flatMap((palette, paletteIndex) =>
  designs.map((design, designIndex) => ({
    id: paletteIndex * designs.length + designIndex + 1,
    name: `${palette.name} ${design.name}`,
    image: design.image(palette),
  })),
);

export const BACKGROUND_COUNT = GAME_BACKGROUNDS.length;
