'use client';

import React, { useState } from 'react';
import { StyleConfig, fontOptions, colorPalettes, stylePresets } from '@/data/job-templates';
import { 
  Palette, 
  Type, 
  Layout, 
  Settings,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Eye,
  EyeOff
} from 'lucide-react';

interface StyleCustomizerProps {
  styleConfig: StyleConfig;
  onStyleChange: (newStyle: StyleConfig) => void;
  onPresetChange?: (presetName: string) => void;
  className?: string;
}

export default function StyleCustomizer({ 
  styleConfig, 
  onStyleChange, 
  onPresetChange,
  className = '' 
}: StyleCustomizerProps) {
  const [activeSection, setActiveSection] = useState<string>('typography');
  const [showPreview, setShowPreview] = useState(true);

  const updateStyle = (updates: Partial<StyleConfig>) => {
    onStyleChange({ ...styleConfig, ...updates });
  };

  const applyPreset = (presetName: string) => {
    const preset = stylePresets[presetName];
    if (preset) {
      onStyleChange(preset);
      onPresetChange?.(presetName);
    }
  };

  const resetToDefaults = () => {
    onStyleChange(stylePresets.modern);
    onPresetChange?.('modern');
  };

  const sections = [
    { id: 'typography', label: 'Typography', icon: Type },
    { id: 'colors', label: 'Colors', icon: Palette },
    { id: 'layout', label: 'Layout', icon: Layout },
    { id: 'advanced', label: 'Advanced', icon: Settings }
  ];

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Style Customizer</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title={showPreview ? 'Hide Preview' : 'Show Preview'}
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={resetToDefaults}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="Reset to Default"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Style Presets */}
      <div className="p-4 border-b border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quick Presets
        </label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(stylePresets).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className="p-3 text-left border border-gray-200 rounded-md hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: preset.primaryColor }}
                />
                <span className="text-sm font-medium capitalize">{key}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1" style={{ fontFamily: preset.titleFont }}>
                {preset.titleFont}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex border-b border-gray-200">
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-medium transition-colors ${
              activeSection === id
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {activeSection === 'typography' && (
          <div className="space-y-6">
            {/* Title Typography */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Title Style</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Font</label>
                  <select
                    value={styleConfig.titleFont}
                    onChange={(e) => updateStyle({ titleFont: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    {fontOptions.map(font => (
                      <option key={font.value} value={font.value}>{font.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Size</label>
                  <select
                    value={styleConfig.titleSize}
                    onChange={(e) => updateStyle({ titleSize: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="1.5rem">Small (24px)</option>
                    <option value="1.875rem">Medium (30px)</option>
                    <option value="2rem">Large (32px)</option>
                    <option value="2.25rem">X-Large (36px)</option>
                    <option value="2.5rem">XX-Large (40px)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Weight</label>
                  <select
                    value={styleConfig.titleWeight}
                    onChange={(e) => updateStyle({ titleWeight: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="300">Light</option>
                    <option value="400">Normal</option>
                    <option value="500">Medium</option>
                    <option value="600">Semi-bold</option>
                    <option value="700">Bold</option>
                    <option value="800">Extra-bold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                  <input
                    type="color"
                    value={styleConfig.titleColor}
                    onChange={(e) => updateStyle({ titleColor: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Subtitle Typography */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Subtitle Style</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Font</label>
                  <select
                    value={styleConfig.subtitleFont}
                    onChange={(e) => updateStyle({ subtitleFont: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    {fontOptions.map(font => (
                      <option key={font.value} value={font.value}>{font.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Size</label>
                  <select
                    value={styleConfig.subtitleSize}
                    onChange={(e) => updateStyle({ subtitleSize: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="1rem">Small (16px)</option>
                    <option value="1.125rem">Medium (18px)</option>
                    <option value="1.25rem">Large (20px)</option>
                    <option value="1.375rem">X-Large (22px)</option>
                    <option value="1.5rem">XX-Large (24px)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Weight</label>
                  <select
                    value={styleConfig.subtitleWeight}
                    onChange={(e) => updateStyle({ subtitleWeight: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="300">Light</option>
                    <option value="400">Normal</option>
                    <option value="500">Medium</option>
                    <option value="600">Semi-bold</option>
                    <option value="700">Bold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                  <input
                    type="color"
                    value={styleConfig.subtitleColor}
                    onChange={(e) => updateStyle({ subtitleColor: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Body Typography */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Body Text Style</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Font</label>
                  <select
                    value={styleConfig.bodyFont}
                    onChange={(e) => updateStyle({ bodyFont: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    {fontOptions.map(font => (
                      <option key={font.value} value={font.value}>{font.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Size</label>
                  <select
                    value={styleConfig.bodySize}
                    onChange={(e) => updateStyle({ bodySize: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="0.875rem">Small (14px)</option>
                    <option value="1rem">Medium (16px)</option>
                    <option value="1.125rem">Large (18px)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Weight</label>
                  <select
                    value={styleConfig.bodyWeight}
                    onChange={(e) => updateStyle({ bodyWeight: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="300">Light</option>
                    <option value="400">Normal</option>
                    <option value="500">Medium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                  <input
                    type="color"
                    value={styleConfig.bodyColor}
                    onChange={(e) => updateStyle({ bodyColor: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'colors' && (
          <div className="space-y-6">
            {/* Color Palettes */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Color Palettes</h4>
              <div className="grid grid-cols-1 gap-3">
                {colorPalettes.map((palette) => (
                  <button
                    key={palette.name}
                    onClick={() => updateStyle({
                      primaryColor: palette.primary,
                      secondaryColor: palette.secondary,
                      accentColor: palette.accent
                    })}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex gap-1">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: palette.primary }} />
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: palette.secondary }} />
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: palette.accent }} />
                    </div>
                    <span className="text-sm font-medium">{palette.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Custom Colors</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Primary Color</label>
                  <input
                    type="color"
                    value={styleConfig.primaryColor}
                    onChange={(e) => updateStyle({ primaryColor: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Secondary Color</label>
                  <input
                    type="color"
                    value={styleConfig.secondaryColor}
                    onChange={(e) => updateStyle({ secondaryColor: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Accent Color</label>
                  <input
                    type="color"
                    value={styleConfig.accentColor}
                    onChange={(e) => updateStyle({ accentColor: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Border Color</label>
                  <input
                    type="color"
                    value={styleConfig.borderColor}
                    onChange={(e) => updateStyle({ borderColor: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'layout' && (
          <div className="space-y-6">
            {/* Spacing */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Spacing</h4>
              <select
                value={styleConfig.spacing}
                onChange={(e) => updateStyle({ spacing: e.target.value as 'compact' | 'normal' | 'spacious' })}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="compact">Compact</option>
                <option value="normal">Normal</option>
                <option value="spacious">Spacious</option>
              </select>
            </div>

            {/* Border Radius */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Border Radius</h4>
              <select
                value={styleConfig.borderRadius}
                onChange={(e) => updateStyle({ borderRadius: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="0rem">None (0px)</option>
                <option value="0.25rem">Small (4px)</option>
                <option value="0.375rem">Medium (6px)</option>
                <option value="0.5rem">Large (8px)</option>
                <option value="0.75rem">X-Large (12px)</option>
                <option value="1rem">XX-Large (16px)</option>
              </select>
            </div>

            {/* Border Width */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Border Width</h4>
              <select
                value={styleConfig.borderWidth}
                onChange={(e) => updateStyle({ borderWidth: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="0px">None</option>
                <option value="1px">Thin (1px)</option>
                <option value="2px">Medium (2px)</option>
                <option value="3px">Thick (3px)</option>
              </select>
            </div>
          </div>
        )}

        {activeSection === 'advanced' && (
          <div className="space-y-6">
            {/* Section Headers */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Section Headers</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Font</label>
                  <select
                    value={styleConfig.sectionHeaderFont}
                    onChange={(e) => updateStyle({ sectionHeaderFont: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    {fontOptions.map(font => (
                      <option key={font.value} value={font.value}>{font.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Size</label>
                  <select
                    value={styleConfig.sectionHeaderSize}
                    onChange={(e) => updateStyle({ sectionHeaderSize: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="1rem">Small (16px)</option>
                    <option value="1.125rem">Medium (18px)</option>
                    <option value="1.25rem">Large (20px)</option>
                    <option value="1.375rem">X-Large (22px)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                  <input
                    type="color"
                    value={styleConfig.sectionHeaderColor}
                    onChange={(e) => updateStyle({ sectionHeaderColor: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Background</label>
                  <input
                    type="color"
                    value={styleConfig.sectionHeaderBackground}
                    onChange={(e) => updateStyle({ sectionHeaderBackground: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* List Styling */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">List Styling</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Bullet Style</label>
                  <select
                    value={styleConfig.bulletStyle}
                    onChange={(e) => updateStyle({ bulletStyle: e.target.value as any })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="disc">Disc</option>
                    <option value="circle">Circle</option>
                    <option value="square">Square</option>
                    <option value="none">None</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Bullet Color</label>
                  <input
                    type="color"
                    value={styleConfig.bulletColor}
                    onChange={(e) => updateStyle({ bulletColor: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Tag Styling */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Skills Tags</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Background</label>
                  <input
                    type="color"
                    value={styleConfig.tagBackground}
                    onChange={(e) => updateStyle({ tagBackground: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Text Color</label>
                  <input
                    type="color"
                    value={styleConfig.tagColor}
                    onChange={(e) => updateStyle({ tagColor: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Border</label>
                  <input
                    type="color"
                    value={styleConfig.tagBorder}
                    onChange={(e) => updateStyle({ tagBorder: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Border Radius</label>
                  <select
                    value={styleConfig.tagBorderRadius}
                    onChange={(e) => updateStyle({ tagBorderRadius: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="0rem">None</option>
                    <option value="0.25rem">Small</option>
                    <option value="0.375rem">Medium</option>
                    <option value="0.5rem">Large</option>
                    <option value="0.75rem">X-Large</option>
                    <option value="9999px">Pill</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Style Preview</h4>
          <div className="bg-white p-4 rounded-md border border-gray-200">
            <h1 
              style={{
                fontFamily: styleConfig.titleFont,
                fontSize: styleConfig.titleSize,
                fontWeight: styleConfig.titleWeight,
                color: styleConfig.titleColor,
                marginBottom: '0.5rem'
              }}
            >
              Job Title
            </h1>
            <h2 
              style={{
                fontFamily: styleConfig.subtitleFont,
                fontSize: styleConfig.subtitleSize,
                fontWeight: styleConfig.subtitleWeight,
                color: styleConfig.subtitleColor,
                marginBottom: '1rem'
              }}
            >
              Section Header
            </h2>
            <p 
              style={{
                fontFamily: styleConfig.bodyFont,
                fontSize: styleConfig.bodySize,
                fontWeight: styleConfig.bodyWeight,
                color: styleConfig.bodyColor,
                marginBottom: '1rem'
              }}
            >
              This is sample body text that shows how your content will look with the selected styling options.
            </p>
            <div className="flex gap-2 flex-wrap">
              <span 
                style={{
                  backgroundColor: styleConfig.tagBackground,
                  color: styleConfig.tagColor,
                  border: `1px solid ${styleConfig.tagBorder}`,
                  borderRadius: styleConfig.tagBorderRadius,
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.875rem'
                }}
              >
                Sample Tag
              </span>
              <span 
                style={{
                  backgroundColor: styleConfig.tagBackground,
                  color: styleConfig.tagColor,
                  border: `1px solid ${styleConfig.tagBorder}`,
                  borderRadius: styleConfig.tagBorderRadius,
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.875rem'
                }}
              >
                Another Tag
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 