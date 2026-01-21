import React from 'react';

interface FocusTheme {
  id: string;
  name: string;
  // Add other theme properties as needed
}

interface ThemeSelectorProps {
  themes: FocusTheme[];
  activeThemeId: string;
  onSelect: (themeId: string) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ themes, activeThemeId, onSelect }) => {
  return (
    <div className="flex space-x-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
      {themes.map((theme) => (
        <button
          key={theme.id}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
            ${activeThemeId === theme.id
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}
          `}
          onClick={() => onSelect(theme.id)}
        >
          {theme.name}
        </button>
      ))}
    </div>
  );
};

export default React.memo(ThemeSelector);
