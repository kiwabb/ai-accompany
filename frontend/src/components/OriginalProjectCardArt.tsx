import OriginalMascot from './OriginalMascot';
import { resolveThemeCharacterForProject } from '../constants/themes';
import type { FocusTheme, VisualTheme, VisualThemeCharacterScene } from '../types/pomodoro';

interface OriginalProjectCardArtProps {
  focusTheme: FocusTheme;
  visualTheme: VisualTheme;
}

const sceneLayout: Record<VisualThemeCharacterScene, { badge: string; side: 'left' | 'right' | 'center' }> = {
  language: { badge: 'Aa', side: 'right' },
  code: { badge: '</>', side: 'center' },
  math: { badge: '∑', side: 'left' },
  review: { badge: '✓', side: 'right' },
  rest: { badge: '…', side: 'left' },
  default: { badge: '•', side: 'center' },
};

const OriginalProjectCardArt = ({ focusTheme, visualTheme }: OriginalProjectCardArtProps) => {
  const character = resolveThemeCharacterForProject(visualTheme, focusTheme);
  const scene = character.scene ?? 'default';
  const layout = sceneLayout[scene];

  return (
    <div
      data-testid={`home-original-theme-icon-${focusTheme.id}`}
      className="relative z-10 h-[92px] w-full max-w-[160px] md:h-[156px] md:max-w-[230px] rounded-[22px] md:rounded-[36px] overflow-hidden border border-white/70 shadow-inner flex items-center justify-center"
      style={{
        background: `linear-gradient(135deg, ${visualTheme.colors.bg} 0%, ${visualTheme.colors.surface} 48%, ${visualTheme.colors.glass} 100%)`,
      }}
    >
      <div
        data-theme-card-element="true"
        className="absolute inset-x-4 bottom-3 h-7 md:h-10 rounded-full opacity-45"
        style={{ backgroundColor: visualTheme.colors.secondary }}
      />
      <div
        data-theme-card-element="true"
        className={`absolute top-4 h-3 w-9 md:h-4 md:w-14 rounded-full opacity-70 ${layout.side === 'right' ? 'right-5' : 'left-5'}`}
        style={{ backgroundColor: visualTheme.colors.primary }}
      />
      <div
        data-theme-card-element="true"
        className={`absolute h-5 w-5 md:h-8 md:w-8 rounded-full opacity-75 ${layout.side === 'center' ? 'right-6 top-8' : 'left-5 top-8'}`}
        style={{ backgroundColor: visualTheme.colors.accent }}
      />
      <div
        data-theme-card-element="true"
        className={`absolute bottom-7 h-8 w-8 md:bottom-10 md:h-12 md:w-12 rounded-[12px] md:rounded-[18px] border-2 opacity-45 rotate-12 ${layout.side === 'left' ? 'right-5' : 'left-5'}`}
        style={{ borderColor: visualTheme.colors.primary, backgroundColor: visualTheme.colors.glass }}
      />
      <div
        data-theme-card-element="true"
        className={`absolute h-2 w-2 md:h-3 md:w-3 rounded-full opacity-80 ${layout.side === 'right' ? 'left-10 bottom-9' : 'right-10 top-7'}`}
        style={{ backgroundColor: visualTheme.colors.secondary }}
      />
      <div
        data-theme-card-element="true"
        className="absolute right-4 bottom-4 rounded-full border px-2 py-1 text-[10px] font-black shadow-sm backdrop-blur-md"
        style={{
          color: visualTheme.colors.text,
          borderColor: visualTheme.colors.border,
          backgroundColor: visualTheme.colors.glass,
        }}
      >
        {layout.badge}
      </div>
      <OriginalMascot
        character={character}
        theme={visualTheme}
        size={layout.side === 'center' ? 86 : 78}
        className="relative z-10 md:scale-125"
      />
    </div>
  );
};

export default OriginalProjectCardArt;
