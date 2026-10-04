import { useState } from 'react';
import './ThemeSettings.css';

interface ThemeSettingsProps {
  onClose: () => void;
}

export interface ThemeConfig {
  name: string;
  primaryColor: string;
  primaryLight: string;
  primaryDark: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  borderLight: string;
  borderDark: string;
  gradientPrimary: string;
  gradientSubtle: string;
  tileColor: string;
  tileHeaderColor: string;
  itemColor: string;
  itemHoverColor: string;
}

const themes: ThemeConfig[] = [
  {
    name: 'Emerald & Gold',
    primaryColor: '#10b981',
    primaryLight: '#6ee7b7',
    primaryDark: '#059669',
    bgColor: '#f0fdf4',
    textColor: '#1e293b',
    borderColor: '#fbbf24',
    borderLight: '#fcd34d',
    borderDark: '#f59e0b',
    gradientPrimary: 'linear-gradient(135deg, #6ee7b7 0%, #10b981 100%)',
    gradientSubtle: 'linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%)',
    tileColor: '#ffffff',
    tileHeaderColor: 'linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%)',
    itemColor: '#f0fdf4',
    itemHoverColor: '#d1fae5',
  },
  {
    name: 'Ocean Blue & Silver',
    primaryColor: '#0ea5e9',
    primaryLight: '#7dd3fc',
    primaryDark: '#0369a1',
    bgColor: '#f0f9ff',
    textColor: '#1e293b',
    borderColor: '#94a3b8',
    borderLight: '#cbd5e1',
    borderDark: '#64748b',
    gradientPrimary: 'linear-gradient(135deg, #7dd3fc 0%, #0ea5e9 100%)',
    gradientSubtle: 'linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%)',
    tileColor: '#ffffff',
    tileHeaderColor: 'linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%)',
    itemColor: '#f0f9ff',
    itemHoverColor: '#dbeafe',
  },
  {
    name: 'Purple & Rose Gold',
    primaryColor: '#a855f7',
    primaryLight: '#c084fc',
    primaryDark: '#7e22ce',
    bgColor: '#faf5ff',
    textColor: '#1e293b',
    borderColor: '#f472b6',
    borderLight: '#f9a8d4',
    borderDark: '#ec4899',
    gradientPrimary: 'linear-gradient(135deg, #c084fc 0%, #a855f7 100%)',
    gradientSubtle: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
    tileColor: '#ffffff',
    tileHeaderColor: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
    itemColor: '#faf5ff',
    itemHoverColor: '#f3e8ff',
  },
  {
    name: 'Sunset Orange & Bronze',
    primaryColor: '#f97316',
    primaryLight: '#fb923c',
    primaryDark: '#c2410c',
    bgColor: '#fff7ed',
    textColor: '#1e293b',
    borderColor: '#92400e',
    borderLight: '#b45309',
    borderDark: '#78350f',
    gradientPrimary: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
    gradientSubtle: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
    tileColor: '#ffffff',
    tileHeaderColor: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
    itemColor: '#fff7ed',
    itemHoverColor: '#fed7aa',
  },
  {
    name: 'Ruby Red & Platinum',
    primaryColor: '#dc2626',
    primaryLight: '#f87171',
    primaryDark: '#991b1b',
    bgColor: '#fef2f2',
    textColor: '#1e293b',
    borderColor: '#e5e7eb',
    borderLight: '#f3f4f6',
    borderDark: '#d1d5db',
    gradientPrimary: 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)',
    gradientSubtle: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
    tileColor: '#ffffff',
    tileHeaderColor: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
    itemColor: '#fef2f2',
    itemHoverColor: '#fee2e2',
  },
  {
    name: 'Midnight & Gold',
    primaryColor: '#1e293b',
    primaryLight: '#475569',
    primaryDark: '#0f172a',
    bgColor: '#f8fafc',
    textColor: '#f5f5f0',
    borderColor: '#fbbf24',
    borderLight: '#fcd34d',
    borderDark: '#f59e0b',
    gradientPrimary: 'linear-gradient(135deg, #475569 0%, #1e293b 100%)',
    gradientSubtle: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    tileColor: '#2d3748',
    tileHeaderColor: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    itemColor: '#1e293b',
    itemHoverColor: '#334155',
  },
];

export default function ThemeSettings({ onClose }: ThemeSettingsProps) {
  const [selectedTheme, setSelectedTheme] = useState<ThemeConfig>(themes[0]);

  const applyTheme = (theme: ThemeConfig) => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', theme.primaryColor);
    root.style.setProperty('--primary-light', theme.primaryLight);
    root.style.setProperty('--primary-dark', theme.primaryDark);
    root.style.setProperty('--bg-color', theme.bgColor);
    root.style.setProperty('--text-color', theme.textColor);
    root.style.setProperty('--border-color', theme.borderColor);
    root.style.setProperty('--border-light', theme.borderLight);
    root.style.setProperty('--border-dark', theme.borderDark);
    root.style.setProperty('--gradient-primary', theme.gradientPrimary);
    root.style.setProperty('--gradient-subtle', theme.gradientSubtle);
    root.style.setProperty('--tile-color', theme.tileColor);
    root.style.setProperty('--tile-header-color', theme.tileHeaderColor);
    root.style.setProperty('--item-color', theme.itemColor);
    root.style.setProperty('--item-hover-color', theme.itemHoverColor);
    
    setSelectedTheme(theme);
    
    // Save theme preference
    localStorage.setItem('selectedTheme', JSON.stringify(theme));
  };

  // Load saved theme on mount
  useState(() => {
    const saved = localStorage.getItem('selectedTheme');
    if (saved) {
      try {
        const theme = JSON.parse(saved);
        applyTheme(theme);
      } catch (e) {
        console.error('Failed to load saved theme:', e);
      }
    }
  });

  return (
    <div className="theme-settings-overlay" onClick={onClose}>
      <div className="theme-settings" onClick={(e) => e.stopPropagation()}>
        <div className="theme-settings-header">
          <h2>Theme Settings</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="theme-settings-content">
          <p className="theme-description">
            Choose a color theme for your RSS reader
          </p>

          <div className="theme-grid">
            {themes.map((theme) => (
              <button
                key={theme.name}
                className={`theme-card ${selectedTheme.name === theme.name ? 'active' : ''}`}
                onClick={() => applyTheme(theme)}
              >
                <div className="theme-preview">
                  <div 
                    className="theme-preview-primary" 
                    style={{ background: theme.gradientPrimary }}
                  />
                  <div 
                    className="theme-preview-tile" 
                    style={{ 
                      backgroundColor: theme.tileColor,
                      borderColor: theme.borderColor 
                    }}
                  >
                    <div 
                      className="theme-preview-tile-header"
                      style={{ background: theme.tileHeaderColor }}
                    />
                  </div>
                </div>
                <span className="theme-name">{theme.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
