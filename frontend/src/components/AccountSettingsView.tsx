import { useState, useEffect } from 'react';
import { apiClient } from '../api/client.ts';

interface AccountSettingsViewProps {
    onProfileUpdated?: () => void;
}

export const AccountSettingsView = ({ onProfileUpdated }: AccountSettingsViewProps) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [profileStatusMessage, setProfileStatusMessage] = useState('');
    const [passwordStatusMessage, setPasswordStatusMessage] = useState('');

    // Load user data on mount
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.firstName) setFirstName(user.firstName);
        if (user.lastName) setLastName(user.lastName);
        if (user.email) setEmail(user.email);
    }, []);

    const handleUpdateProfile = async () => {
        if (!firstName.trim() || !lastName.trim()) {
            setProfileStatusMessage('First name and last name are required.');
            return;
        }

        try {
            setIsUpdatingProfile(true);
            setProfileStatusMessage('Updating profile...');

            const response = await apiClient.patch('/auth/profile', {
                firstName: firstName.trim(),
                lastName: lastName.trim()
            });

            // Update localStorage with new user data
            const updatedUser = {
                ...JSON.parse(localStorage.getItem('user') || '{}'),
                firstName: response.data.user.firstName,
                lastName: response.data.user.lastName
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            setProfileStatusMessage('Profile updated successfully!');
            
            // Trigger refresh to update workspace member lists
            if (onProfileUpdated) {
                onProfileUpdated();
            }
            
            // Clear message after 3 seconds
            setTimeout(() => setProfileStatusMessage(''), 3000);
        } catch (err: any) {
            console.error('Error updating profile:', err);
            setProfileStatusMessage(err.response?.data?.error || 'Failed to update profile.');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (!oldPassword.trim() || !newPassword.trim()) {
            setPasswordStatusMessage('Old password and new password are required.');
            return;
        }

        if (newPassword.length < 6) {
            setPasswordStatusMessage('New password must be at least 6 characters long.');
            return;
        }

        try {
            setIsUpdatingPassword(true);
            setPasswordStatusMessage('Updating password...');

            await apiClient.patch('/auth/password', {
                oldPassword: oldPassword.trim(),
                newPassword: newPassword.trim()
            });

            setPasswordStatusMessage('Password updated successfully!');
            setOldPassword('');
            setNewPassword('');
            
            // Clear message after 3 seconds
            setTimeout(() => setPasswordStatusMessage(''), 3000);
        } catch (err: any) {
            console.error('Error updating password:', err);
            setPasswordStatusMessage(err.response?.data?.error || 'Failed to update password.');
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 md:p-8 max-w-4xl w-full mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-150">
            <div className="space-y-1">
                <h2 className="text-xl sm:text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Account Settings</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage your personal information and security settings.</p>
            </div>

            {/* Profile Information Block */}
            <div className="space-y-5 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 bg-white dark:bg-zinc-900/50 shadow-sm">
                <div className="space-y-1">
                    <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Profile Information</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Update your personal details.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">First Name</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            disabled={isUpdatingProfile}
                            className="w-full text-sm rounded-lg px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400/50 focus:border-zinc-400 dark:focus:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Last Name</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            disabled={isUpdatingProfile}
                            className="w-full text-sm rounded-lg px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400/50 focus:border-zinc-400 dark:focus:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Email</label>
                    <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full text-sm rounded-lg px-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-800 cursor-not-allowed"
                    />
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">Email cannot be changed. Contact support if you need to update your email.</p>
                </div>

                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <span className={`text-xs font-mono ${profileStatusMessage.includes('success') ? 'text-green-600 dark:text-green-400' : profileStatusMessage.includes('Failed') || profileStatusMessage.includes('required') ? 'text-red-600 dark:text-red-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
                        {profileStatusMessage || '// Ready to update profile'}
                    </span>
                    <button
                        onClick={handleUpdateProfile}
                        disabled={isUpdatingProfile || !firstName.trim() || !lastName.trim()}
                        className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-zinc-50 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 text-sm font-medium px-5 py-2.5 rounded-lg cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        {isUpdatingProfile ? 'Updating...' : 'Save Profile'}
                    </button>
                </div>
            </div>

            {/* Password Security Block */}
            <div className="space-y-5 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 bg-white dark:bg-zinc-900/50 shadow-sm">
                <div className="space-y-1">
                    <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Password Security</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Update your password to keep your account secure.</p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Current Password</label>
                        <input
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            disabled={isUpdatingPassword}
                            placeholder="Enter your current password"
                            className="w-full text-sm rounded-lg px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400/50 focus:border-zinc-400 dark:focus:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={isUpdatingPassword}
                            placeholder="Enter your new password (min 6 characters)"
                            className="w-full text-sm rounded-lg px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400/50 focus:border-zinc-400 dark:focus:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <span className={`text-xs font-mono ${passwordStatusMessage.includes('Password updated') ? 'text-green-600 dark:text-green-400' : passwordStatusMessage.includes('Failed') || passwordStatusMessage.includes('required') || passwordStatusMessage.includes('incorrect') ? 'text-red-600 dark:text-red-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
                        {passwordStatusMessage || '// Ready to update password'}
                    </span>
                    <button
                        onClick={handleUpdatePassword}
                        disabled={isUpdatingPassword || !oldPassword.trim() || !newPassword.trim()}
                        className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-zinc-50 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 text-sm font-medium px-5 py-2.5 rounded-lg cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                </div>
            </div>
        </div>
    );
};