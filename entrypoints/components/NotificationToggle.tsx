interface ToggleProps {
	enabled: boolean;
	onToggle: (val: boolean) => void;
}

export const NotificationToggle = ({ enabled, onToggle }: ToggleProps) => {
	return (
		<div className="absolute -top-11 right-4 flex items-center group">
			<label className="relative inline-flex items-center cursor-pointer">
				<input
					type="checkbox"
					className="sr-only peer"
					checked={enabled}
					onChange={(e) => onToggle(e.target.checked)}
				/>
				<div className="w-14 h-7 bg-black/25 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-['🔔'] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all after:flex after:items-center after:justify-center after:text-[10px] peer-checked:bg-amber-400 shadow-inner"></div>
			</label>
			{/* Tooltip */}
			<span className="absolute bottom-full mb-2 hidden group-hover:block bg-black/80 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
				Toggle notifications
			</span>
		</div>
	);
};
