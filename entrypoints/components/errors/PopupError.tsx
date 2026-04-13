import PopupSkeleton from "../skeletons/PopupSkeleton";

interface PopupErrorProps {
	msg: string;
	clickFn: () => void;
}

export default function PopupError({ msg, clickFn }: PopupErrorProps) {
	// Detect geolocation-related errors more broadly
	const isGeolocationError =
		msg.toLowerCase().includes("timeout") ||
		msg.toLowerCase().includes("geolocation") ||
		msg.toLowerCase().includes("permission") ||
		msg.toLowerCase().includes("location") ||
		msg.toLowerCase().includes("position");

	const handleSettingsClick = () => {
		if (typeof browser !== "undefined" && browser.runtime) {
			browser.runtime.openOptionsPage();
		}
	};

	return (
		<div className="relative min-w-[300px]">
			<PopupSkeleton />
			<div className="absolute top-0 left-0 h-full w-full flex flex-col justify-center items-center backdrop-blur-md bg-black/60 rounded-lg p-4">
				<div className="w-full max-w-sm">
					<p className="text-red-400 text-center text-sm font-semibold break-words">
						Error: {msg}
					</p>
					{isGeolocationError && (
						<p className="text-yellow-300 text-center text-xs mt-3 px-2 leading-relaxed">
							💡 Try setting your location manually in Settings or click Retry
						</p>
					)}
					<div className="flex flex-col gap-2 justify-center mt-6">
						<button
							onClick={clickFn}
							className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
						>
							🔄 Retry
						</button>
						{isGeolocationError && (
							<button
								onClick={handleSettingsClick}
								className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
							>
								⚙️ Settings
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
