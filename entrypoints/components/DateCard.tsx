import { DateInfo } from "@/types/prayer";
import { OpenSidebarButton } from "./OpenSidebarButton";

export const DateCard = ({ weekday, day, month }: DateInfo) => {
	return (
		<div className="relative p-2 date-card">
			{/* Circular Options Button - Top Right */}
			<button
				onClick={() => browser.runtime.openOptionsPage()}
				className="options-btn"
				title="Open settings"
			>
				⚙️
			</button>

			{/* Date Display */}
			<div className=" bg-primary shadow-md dark:shadow-lg text-gray-900 text-center py-4 rounded-date flex flex-col justify-center min-w-25 transition-all duration-300">
				<h6 className="text-xl animate-fade-in">{weekday}</h6>
				<h1 className="text-[2.2rem] font-bold leading-none my-1 animate-fade-in">
					{day}
				</h1>
				<h6 className="text-xl animate-fade-in">{month}</h6>
				<div
					style={{
						marginTop: "1rem",
						borderTop: "1px solid #e0e0e0",
						paddingTop: "1rem",
					}}
				>
					{/* <OpenSidebarButton label="📖 Open Sidebar" /> */}
				</div>
			</div>
		</div>
	);
};
