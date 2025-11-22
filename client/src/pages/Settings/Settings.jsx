import React, { useState } from 'react';
import { 
  Save, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Database, 
  Download,
  Upload
} from 'lucide-react';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState({
    // Profile Settings
    profile: {
      fullName: 'Aarya Raj',
      email: 'aarya@example.com',
      role: 'Inventory Manager',
      language: 'en',
      timezone: 'Asia/Kolkata'
    },
    // Notification Settings
    notifications: {
      emailNotifications: true,
      lowStockAlerts: true,
      pendingReceipts: true,
      pendingDeliveries: false,
      systemUpdates: true
    },
    // Security Settings
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30
    },
    // Appearance Settings
    appearance: {
      theme: 'light',
      compactMode: false,
      sidebarCollapsed: false
    },
    // System Settings
    system: {
      autoBackup: true,
      backupFrequency: 'daily',
      exportFormat: 'csv'
    }
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
  };

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'system', label: 'System', icon: Database }
  ];

  const SettingSection = ({ title, description, children }) => (
    <div className="bg-white rounded-xl shadow-sm border border-[#D7CCC8] p-6 mb-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[#3E2723]">{title}</h3>
        {description && (
          <p className="text-sm text-[#8D6E63] mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  );

  const SettingRow = ({ label, description, children }) => (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-4 border-b border-[#F5F0EC] last:border-b-0">
      <div className="flex-1">
        <label className="text-sm font-medium text-[#3E2723]">{label}</label>
        {description && (
          <p className="text-xs text-[#8D6E63] mt-1">{description}</p>
        )}
      </div>
      <div className="lg:w-48">
        {children}
      </div>
    </div>
  );

  const ToggleSwitch = ({ checked, onChange, disabled = false }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${checked ? 'bg-[#8E8D4F]' : 'bg-[#D7CCC8]'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${checked ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );

  const SelectInput = ({ value, onChange, options, disabled = false }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-3 py-2 border border-[#D7CCC8] rounded-lg text-sm text-[#3E2723] bg-white focus:outline-none focus:ring-2 focus:ring-[#5D4037] focus:border-transparent disabled:opacity-50"
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );

  const TextInput = ({ value, onChange, type = 'text', disabled = false, placeholder }) => (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-[#D7CCC8] rounded-lg text-sm text-[#3E2723] bg-white focus:outline-none focus:ring-2 focus:ring-[#5D4037] focus:border-transparent disabled:opacity-50"
    />
  );

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <SettingSection title="Personal Information" description="Update your personal details and preferences">
        <SettingRow label="Full Name" description="Your display name across the application">
          <TextInput
            value={settings.profile.fullName}
            onChange={(value) => handleInputChange('profile', 'fullName', value)}
          />
        </SettingRow>
        
        <SettingRow label="Email Address" description="Your primary email for notifications">
          <TextInput
            type="email"
            value={settings.profile.email}
            onChange={(value) => handleInputChange('profile', 'email', value)}
          />
        </SettingRow>
        
        <SettingRow label="Role" description="Your system role (read-only)">
          <TextInput
            value={settings.profile.role}
            disabled
          />
        </SettingRow>
      </SettingSection>

      <SettingSection title="Preferences" description="Customize your application experience">
        <SettingRow label="Language" description="Interface language">
          <SelectInput
            value={settings.profile.language}
            onChange={(value) => handleInputChange('profile', 'language', value)}
            options={[
              { value: 'en', label: 'English' },
              { value: 'es', label: 'Spanish' },
              { value: 'fr', label: 'French' },
              { value: 'de', label: 'German' }
            ]}
          />
        </SettingRow>
        
        <SettingRow label="Timezone" description="Your local timezone">
          <SelectInput
            value={settings.profile.timezone}
            onChange={(value) => handleInputChange('profile', 'timezone', value)}
            options={[
              { value: 'Asia/Kolkata', label: 'IST - India Standard Time' },
              { value: 'America/New_York', label: 'EST - Eastern Standard Time' },
              { value: 'UTC', label: 'UTC - Coordinated Universal Time' }
            ]}
          />
        </SettingRow>
      </SettingSection>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <SettingSection title="Email Notifications" description="Control when you receive email alerts">
        <SettingRow 
          label="Email Notifications" 
          description="Receive all notifications via email"
        >
          <ToggleSwitch
            checked={settings.notifications.emailNotifications}
            onChange={(value) => handleInputChange('notifications', 'emailNotifications', value)}
          />
        </SettingRow>
        
        <SettingRow 
          label="Low Stock Alerts" 
          description="Get notified when stock levels are low"
        >
          <ToggleSwitch
            checked={settings.notifications.lowStockAlerts}
            onChange={(value) => handleInputChange('notifications', 'lowStockAlerts', value)}
          />
        </SettingRow>
        
        <SettingRow 
          label="Pending Receipts" 
          description="Notifications for incoming receipts"
        >
          <ToggleSwitch
            checked={settings.notifications.pendingReceipts}
            onChange={(value) => handleInputChange('notifications', 'pendingReceipts', value)}
          />
        </SettingRow>
        
        <SettingRow 
          label="Pending Deliveries" 
          description="Notifications for outgoing deliveries"
        >
          <ToggleSwitch
            checked={settings.notifications.pendingDeliveries}
            onChange={(value) => handleInputChange('notifications', 'pendingDeliveries', value)}
          />
        </SettingRow>
        
        <SettingRow 
          label="System Updates" 
          description="Important system maintenance notifications"
        >
          <ToggleSwitch
            checked={settings.notifications.systemUpdates}
            onChange={(value) => handleInputChange('notifications', 'systemUpdates', value)}
          />
        </SettingRow>
      </SettingSection>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <SettingSection title="Authentication" description="Manage your account security">
        <SettingRow 
          label="Two-Factor Authentication" 
          description="Add an extra layer of security to your account"
        >
          <ToggleSwitch
            checked={settings.security.twoFactorAuth}
            onChange={(value) => handleInputChange('security', 'twoFactorAuth', value)}
          />
        </SettingRow>
        
        <SettingRow 
          label="Session Timeout" 
          description="Automatically log out after inactivity (minutes)"
        >
          <SelectInput
            value={settings.security.sessionTimeout}
            onChange={(value) => handleInputChange('security', 'sessionTimeout', parseInt(value))}
            options={[
              { value: 15, label: '15 minutes' },
              { value: 30, label: '30 minutes' },
              { value: 60, label: '1 hour' },
              { value: 120, label: '2 hours' }
            ]}
          />
        </SettingRow>
      </SettingSection>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <SettingSection title="Theme & Layout" description="Customize how the application looks">
        <SettingRow 
          label="Theme" 
          description="Choose your preferred color scheme"
        >
          <SelectInput
            value={settings.appearance.theme}
            onChange={(value) => handleInputChange('appearance', 'theme', value)}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'auto', label: 'Auto (System)' }
            ]}
          />
        </SettingRow>
        
        <SettingRow 
          label="Compact Mode" 
          description="Use denser spacing for more content"
        >
          <ToggleSwitch
            checked={settings.appearance.compactMode}
            onChange={(value) => handleInputChange('appearance', 'compactMode', value)}
          />
        </SettingRow>
        
        <SettingRow 
          label="Collapse Sidebar" 
          description="Keep sidebar collapsed by default"
        >
          <ToggleSwitch
            checked={settings.appearance.sidebarCollapsed}
            onChange={(value) => handleInputChange('appearance', 'sidebarCollapsed', value)}
          />
        </SettingRow>
      </SettingSection>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <SettingSection title="Data Management" description="Manage your data and backups">
        <SettingRow 
          label="Auto Backup" 
          description="Automatically backup your data"
        >
          <ToggleSwitch
            checked={settings.system.autoBackup}
            onChange={(value) => handleInputChange('system', 'autoBackup', value)}
          />
        </SettingRow>
        
        <SettingRow 
          label="Backup Frequency" 
          description="How often to create backups"
        >
          <SelectInput
            value={settings.system.backupFrequency}
            onChange={(value) => handleInputChange('system', 'backupFrequency', value)}
            options={[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' }
            ]}
          />
        </SettingRow>
        
        <SettingRow 
          label="Export Format" 
          description="Default format for data exports"
        >
          <SelectInput
            value={settings.system.exportFormat}
            onChange={(value) => handleInputChange('system', 'exportFormat', value)}
            options={[
              { value: 'csv', label: 'CSV' },
              { value: 'excel', label: 'Excel' },
              { value: 'json', label: 'JSON' }
            ]}
          />
        </SettingRow>
      </SettingSection>

      <SettingSection title="Data Operations" description="Import and export your data">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-2 px-4 py-3 border border-[#D7CCC8] rounded-lg text-sm font-medium text-[#5D4037] hover:bg-[#FBF8F4] transition-colors">
            <Download size={18} />
            Export Data
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 border border-[#D7CCC8] rounded-lg text-sm font-medium text-[#5D4037] hover:bg-[#FBF8F4] transition-colors">
            <Upload size={18} />
            Import Data
          </button>
        </div>
      </SettingSection>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'profile': return renderProfileSettings();
      case 'notifications': return renderNotificationSettings();
      case 'security': return renderSecuritySettings();
      case 'appearance': return renderAppearanceSettings();
      case 'system': return renderSystemSettings();
      default: return renderProfileSettings();
    }
  };

  return (
    <div className="w-full h-screen bg-[#FBF8F4] pt-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#3E2723]">Settings</h1>
            <p className="text-sm text-[#8D6E63] mt-1">
              Manage your account preferences and application settings
            </p>
          </div>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#5D4037] text-[#F5F0EC] rounded-lg text-sm font-medium hover:bg-[#3E2723] transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-start lg:self-auto"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-[#D7CCC8] p-4">
              <nav className="space-y-1">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                        ${isActive 
                          ? 'bg-[#5D4037] text-[#F5F0EC]' 
                          : 'text-[#5D4037] hover:bg-[#FBF8F4]'
                        }
                      `}
                    >
                      <Icon size={18} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-h-0">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;