import React from "react";
import { PrayerName } from "@/types/prayer";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import SettingCard from "./SettingCard";

/**
 * NotificationSettings component
 * Displays notification preferences with:
 * - Master toggle for all notifications
 * - Per-prayer checkboxes when enabled
 * - Sound and vibration options
 */
export function NotificationSettings() {
	const { settings, notifiablePrayers, toggleMaster, togglePrayer, isLoading } =
		useNotificationSettings();

	if (isLoading) {
		return (
			<div className="animate-pulse space-y-4">
				<div className="h-12 bg-gray-300 dark:bg-gray-700 rounded-lg" />
				{[1, 2, 3, 4, 5].map((i) => (
					<div
						key={i}
						className="h-10 bg-gray-300 dark:bg-gray-700 rounded-lg"
					/>
				))}
			</div>
		);
	}

	return (
		<div className="space-y-6 pb-3">
			{/* Master Toggle */}
			<SettingCard
				title="Enable Notifications"
				desc={
					settings.enabled
						? "Receive prayer time reminders"
						: "All notifications are disabled"
				}
			>
				<label className="relative inline-flex items-center cursor-pointer">
					<input
						type="checkbox"
						checked={settings.enabled}
						onChange={(e) => toggleMaster(e.target.checked)}
						className="sr-only peer"
					/>
					<div className="w-14 h-8 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-600 dark:peer-focus:ring-green-500 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500 dark:peer-checked:bg-green-600"></div>
				</label>
			</SettingCard>
			{/* <div className="p-4 bg-white/60 dark:bg-[#0f3460]/60 rounded-xl border border-yellow-100/20 dark:border-white/10">
				<div className="flex items-center justify-between">
					<div>
						<h3 className="font-semibold text-gray-900 dark:text-white">
							Enable Notifications
						</h3>
						<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
							{settings.enabled
								? "Receive prayer time reminders"
								: "All notifications are disabled"}
						</p>
					</div>
					<label className="relative inline-flex items-center cursor-pointer">
						<input
							type="checkbox"
							checked={settings.enabled}
							onChange={(e) => toggleMaster(e.target.checked)}
							className="sr-only peer"
						/>
						<div className="w-14 h-8 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-500 dark:peer-focus:ring-yellow-400 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-yellow-500 dark:peer-checked:bg-yellow-600"></div>
					</label>
				</div>
			</div> */}

			{/* Per-Prayer Settings (shown when master is enabled) */}
			{settings.enabled && (
				<>
					<div className="space-y-3 px-6">
						<h4 className="font-semibold text-gray-900 dark:text-white px-2">
							Prayer Notifications
						</h4>
						<div className="space-y-2 bg-white/40 dark:bg-[#0f3460]/40 rounded-xl p-4 border border-yellow-100/10 dark:border-white/5">
							{notifiablePrayers.map((prayerName) => (
								<PrayerNotificationToggle
									key={prayerName}
									prayerName={prayerName}
									enabled={settings.prayers[prayerName]}
									onToggle={togglePrayer}
								/>
							))}
						</div>
					</div>

					{/* Help Text */}
					<div className="p-3 mx-6 mb-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200/30 dark:border-blue-400/20">
						<p className="text-xs text-blue-900 dark:text-blue-300">
							💡 <strong>Tip:</strong> Disable individual prayers to reduce
							notifications. All alarms will be reschedule automatically.
						</p>
					</div>
				</>
			)}

			{/* When disabled message */}
			{!settings.enabled && (
				<div className="p-4 mx-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200/30 dark:border-yellow-400/20">
					<p className="text-sm text-yellow-900 dark:text-yellow-300">
						⚠️ <strong>Notifications are disabled.</strong> Enable them above to
						receive prayer time reminders.
					</p>
				</div>
			)}
		</div>
	);
}

/**
 * Individual prayer notification toggle
 */
interface PrayerNotificationToggleProps {
	prayerName: PrayerName;
	enabled: boolean;
	onToggle: (prayerName: PrayerName, enabled: boolean) => Promise<void>;
}

function PrayerNotificationToggle({
	prayerName,
	enabled,
	onToggle,
}: PrayerNotificationToggleProps) {
	const [isUpdating, setIsUpdating] = React.useState(false);

	const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
		setIsUpdating(true);
		try {
			await onToggle(prayerName, e.target.checked);
		} catch (error) {
			console.error(`Failed to toggle ${prayerName}:`, error);
		} finally {
			setIsUpdating(false);
		}
	};

	return (
		<label className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/30 dark:hover:bg-white/5 rounded-lg transition-colors">
			<input
				type="checkbox"
				checked={enabled}
				onChange={handleToggle}
				disabled={isUpdating}
				className="w-5 h-5 cursor-pointer accent-yellow-500 disabled:opacity-50"
			/>
			<span className="font-medium text-gray-900 dark:text-white flex-1">
				{prayerName}
			</span>
			{isUpdating && (
				<span className="text-xs text-gray-500 dark:text-gray-400">
					Updating...
				</span>
			)}
		</label>
	);
}

export default NotificationSettings;
