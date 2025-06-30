import React, { useState } from 'react';
import { Settings, User, Palette, Brain, Shield, Mic } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { User as UserType, AISettings, VoiceSettings } from '../../types';
import { AI_PERSONALITIES } from '../../data/constants';
import { voiceRecognitionService } from '../../services/voiceRecognition';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  onUpdateUser: (user: UserType) => void;
  aiSettings: AISettings;
  onUpdateAI: (settings: AISettings) => void;
  voiceSettings: VoiceSettings;
  onUpdateVoice: (settings: VoiceSettings) => void;
}

export function SettingsModal({ 
  isOpen, 
  onClose, 
  user, 
  onUpdateUser, 
  aiSettings, 
  onUpdateAI,
  voiceSettings,
  onUpdateVoice
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [tempAISettings, setTempAISettings] = useState(aiSettings);
  const [languageTestResult, setLanguageTestResult] = useState<string>('');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'ai', label: 'AI Settings', icon: Brain },
    { id: 'voice', label: 'Voice', icon: Mic },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'privacy', label: 'Privacy', icon: Shield }
  ];

  const supportedLanguages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'en-AU', name: 'English (Australia)' },
    { code: 'en-CA', name: 'English (Canada)' },
    { code: 'es-ES', name: 'Spanish (Spain)' },
    { code: 'es-MX', name: 'Spanish (Mexico)' },
    { code: 'fr-FR', name: 'French (France)' },
    { code: 'fr-CA', name: 'French (Canada)' },
    { code: 'de-DE', name: 'German' },
    { code: 'it-IT', name: 'Italian' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'pt-PT', name: 'Portuguese (Portugal)' },
    { code: 'ru-RU', name: 'Russian' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'ko-KR', name: 'Korean' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
    { code: 'zh-TW', name: 'Chinese (Traditional)' },
    { code: 'ar-SA', name: 'Arabic' },
    { code: 'hi-IN', name: 'Hindi' },
    { code: 'th-TH', name: 'Thai' },
    { code: 'tr-TR', name: 'Turkish' },
    { code: 'pl-PL', name: 'Polish' },
    { code: 'nl-NL', name: 'Dutch' },
    { code: 'sv-SE', name: 'Swedish' },
    { code: 'da-DK', name: 'Danish' },
    { code: 'no-NO', name: 'Norwegian' },
    { code: 'fi-FI', name: 'Finnish' }
  ];

  const colorSchemes = [
    { id: 'purple', name: 'Purple', colors: ['from-purple-500', 'to-indigo-500'] },
    { id: 'blue', name: 'Blue', colors: ['from-blue-500', 'to-cyan-500'] },
    { id: 'green', name: 'Green', colors: ['from-emerald-500', 'to-teal-500'] },
    { id: 'pink', name: 'Pink', colors: ['from-pink-500', 'to-rose-500'] },
    { id: 'orange', name: 'Orange', colors: ['from-orange-500', 'to-amber-500'] },
    { id: 'slate', name: 'Slate', colors: ['from-slate-500', 'to-gray-500'] }
  ];

  const handleSave = () => {
    onUpdateAI(tempAISettings);
    onClose();
  };

  const testLanguageSupport = (language: string) => {
    const result = voiceRecognitionService.testLanguageSupport(language);
    if (result.supported) {
      setLanguageTestResult(`✅ ${language} is supported`);
    } else {
      setLanguageTestResult(`⚠️ ${language} not supported. Will use ${result.fallback} instead.`);
    }
    setTimeout(() => setLanguageTestResult(''), 3000);
  };

  const handleLanguageChange = (language: string) => {
    const result = voiceRecognitionService.testLanguageSupport(language);
    const finalLanguage = result.supported ? language : result.fallback!;
    
    onUpdateVoice({ ...voiceSettings, language: finalLanguage });
    
    if (!result.supported) {
      setLanguageTestResult(`Language changed to ${finalLanguage} (closest supported language)`);
      setTimeout(() => setLanguageTestResult(''), 3000);
    }
  };

  const updateUserPreference = (key: string, value: any) => {
    if (!user) return;
    const updatedUser = {
      ...user,
      preferences: {
        ...user.preferences,
        [key]: value
      },
      updatedAt: new Date()
    };
    onUpdateUser(updatedUser);
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" size="xl">
      <div className="flex gap-8">
        {/* Sidebar */}
        <div className="w-64 border-r border-slate-200 pr-8">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-2xl transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 font-semibold shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Display Name
                </label>
                <input
                  type="text"
                  value={user.name}
                  onChange={(e) => onUpdateUser({ ...user, name: e.target.value, updatedAt: new Date() })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Avatar
                </label>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <Button variant="secondary" size="sm">
                    Change Avatar
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Communication Goals
                </label>
                <textarea
                  value={user.profile.goals.join(', ')}
                  onChange={(e) => onUpdateUser({
                    ...user,
                    profile: {
                      ...user.profile,
                      goals: e.target.value.split(',').map(g => g.trim()).filter(Boolean)
                    },
                    updatedAt: new Date()
                  })}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all resize-none"
                  placeholder="Better emotional awareness, stress management, relationship skills..."
                />
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-4">
                  AI Personality
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(AI_PERSONALITIES).map(([key, personality]) => (
                    <button
                      key={key}
                      onClick={() => updateUserPreference('aiPersonality', key)}
                      className={`p-6 text-left border rounded-2xl transition-all duration-200 ${
                        user.preferences.aiPersonality === key
                          ? 'border-indigo-300 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-md'
                          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="font-semibold text-slate-900 mb-2">{personality.name}</div>
                      <div className="text-sm text-slate-600 leading-relaxed">{personality.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={tempAISettings.apiKey}
                  onChange={(e) => setTempAISettings({ ...tempAISettings, apiKey: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
                  placeholder="sk-..."
                />
                <p className="text-xs text-slate-500 mt-2">
                  Required for advanced emotional analysis. Your key is stored locally and never shared.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Model
                </label>
                <select
                  value={tempAISettings.model}
                  onChange={(e) => setTempAISettings({ ...tempAISettings, model: e.target.value as any })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
                >
                  <option value="gpt-4o-mini">GPT-4o Mini (Recommended)</option>
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Response Temperature: {tempAISettings.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={tempAISettings.temperature}
                  onChange={(e) => setTempAISettings({ ...tempAISettings, temperature: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>More Focused</span>
                  <span>More Creative</span>
                </div>
              </div>

              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                <div className="flex items-center gap-3 text-blue-800 font-semibold mb-3">
                  <Brain className="h-5 w-5" />
                  AI Status
                </div>
                <div className="text-sm text-blue-700">
                  {tempAISettings.apiKey ? (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Enhanced Analysis Enabled
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      Basic Analysis (Add API key for advanced features)
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Enable Voice Input
                  </label>
                  <p className="text-xs text-slate-500 mt-1">
                    Allow speech-to-text for hands-free interaction
                  </p>
                </div>
                <button
                  onClick={() => onUpdateVoice({ ...voiceSettings, enabled: !voiceSettings.enabled })}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ${
                    voiceSettings.enabled ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 shadow-lg ${
                      voiceSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Language
                </label>
                <div className="flex gap-3">
                  <select
                    value={voiceSettings.language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
                  >
                    {supportedLanguages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => testLanguageSupport(voiceSettings.language)}
                  >
                    Test
                  </Button>
                </div>
                {languageTestResult && (
                  <p className="text-xs mt-3 p-3 bg-slate-50 rounded-xl border">
                    {languageTestResult}
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-2">
                  Current: {voiceSettings.language} | Browser support varies by language
                </p>
              </div>

              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Noise Suppression
                  </label>
                  <p className="text-xs text-slate-500 mt-1">
                    Reduce background noise during recording
                  </p>
                </div>
                <button
                  onClick={() => onUpdateVoice({ ...voiceSettings, noiseSuppressionEnabled: !voiceSettings.noiseSuppressionEnabled })}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ${
                    voiceSettings.noiseSuppressionEnabled ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 shadow-lg ${
                      voiceSettings.noiseSuppressionEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="p-6 bg-yellow-50 rounded-2xl border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-3">Browser Compatibility</h4>
                <p className="text-sm text-yellow-700 leading-relaxed">
                  {voiceRecognitionService.getBrowserSpecificGuidance()}
                </p>
              </div>

              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3">Voice Recognition Status</h4>
                <div className="text-sm text-blue-700 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${voiceRecognitionService.constructor.isSupported() ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>Browser Support: {voiceRecognitionService.constructor.isSupported() ? 'Available' : 'Not Available'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${voiceSettings.enabled ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                    <span>Voice Input: {voiceSettings.enabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Current Language: {voiceSettings.language}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-4">
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {['light', 'dark', 'auto'].map((theme) => (
                    <button
                      key={theme}
                      onClick={() => updateUserPreference('theme', theme)}
                      className={`p-6 text-center border rounded-2xl transition-all duration-200 capitalize ${
                        user.preferences.theme === theme
                          ? 'border-indigo-300 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-md'
                          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="font-semibold text-slate-900">{theme}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {theme === 'light' && 'Always light mode'}
                        {theme === 'dark' && 'Always dark mode'}
                        {theme === 'auto' && 'Follow system'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-4">
                  Color Scheme
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {colorSchemes.map((scheme) => (
                    <button
                      key={scheme.id}
                      onClick={() => updateUserPreference('colorScheme', scheme.id)}
                      className={`p-6 text-center border rounded-2xl transition-all duration-200 ${
                        user.preferences.colorScheme === scheme.id
                          ? 'border-indigo-300 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-md'
                          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${scheme.colors[0]} ${scheme.colors[1]} mx-auto mb-3 shadow-lg`}></div>
                      <div className="font-semibold text-slate-900">{scheme.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-4">
                  Font Size
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'small', name: 'Small', size: 'text-sm' },
                    { id: 'medium', name: 'Medium', size: 'text-base' },
                    { id: 'large', name: 'Large', size: 'text-lg' }
                  ].map((size) => (
                    <button
                      key={size.id}
                      onClick={() => updateUserPreference('fontSize', size.id)}
                      className={`p-6 text-center border rounded-2xl transition-all duration-200 ${
                        user.preferences.fontSize === size.id
                          ? 'border-indigo-300 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-md'
                          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <div className={`font-semibold text-slate-900 ${size.size} mb-2`}>Aa</div>
                      <div className="text-sm text-slate-600">{size.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200">
                <h4 className="font-semibold text-indigo-800 mb-3">Preview</h4>
                <div className="space-y-3">
                  <div className="p-4 bg-white rounded-xl shadow-sm">
                    <div className={`font-semibold text-slate-900 ${
                      user.preferences.fontSize === 'small' ? 'text-sm' :
                      user.preferences.fontSize === 'large' ? 'text-lg' : 'text-base'
                    }`}>
                      Sample message text
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Theme: {user.preferences.theme} • Color: {user.preferences.colorScheme} • Size: {user.preferences.fontSize}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-8">
              <div className="p-6 bg-green-50 rounded-2xl border border-green-200">
                <h3 className="font-semibold text-green-800 mb-3">Your Privacy is Protected</h3>
                <ul className="text-sm text-green-700 space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                    All conversations are stored locally on your device
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                    No data is sent to our servers
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                    API keys are encrypted and stored securely
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                    You have full control over your data
                  </li>
                </ul>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">
                      Auto-save Conversations
                    </label>
                    <p className="text-xs text-slate-500 mt-1">
                      Automatically save conversations as you chat
                    </p>
                  </div>
                  <button
                    onClick={() => updateUserPreference('autoSave', !user.preferences.autoSave)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ${
                      user.preferences.autoSave ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 shadow-lg ${
                        user.preferences.autoSave ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">
                      Notifications
                    </label>
                    <p className="text-xs text-slate-500 mt-1">
                      Receive notifications for reminders and insights
                    </p>
                  </div>
                  <button
                    onClick={() => updateUserPreference('notifications', !user.preferences.notifications)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ${
                      user.preferences.notifications ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 shadow-lg ${
                        user.preferences.notifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="pt-6 border-t border-slate-200">
                  <h4 className="font-semibold text-slate-900 mb-4">Data Management</h4>
                  <div className="flex gap-3">
                    <Button variant="secondary" size="sm">
                      Export All Data
                    </Button>
                    <Button variant="danger" size="sm">
                      Clear All Data
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-8 pt-8 border-t border-slate-200">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </Modal>
  );
}