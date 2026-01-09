import { DateInfo } from "@/types/prayer";

export const DateCard = ({ weekday, day, month }: DateInfo) => {
	return (
		<div className="relative p-2">
			{/* Date Display */}
			<div className="bg-primary bg-linear-180 from-offwhite-medium to-offwhite-transparent shadow-lg text-black text-center py-4 rounded-date flex flex-col justify-center min-w-25">
				<h6 className="text-xl">{weekday}</h6>
				<h1 className="text-[2.2rem] font-bold leading-none my-1">{day}</h1>
				<h6 className="text-xl">{month}</h6>
			</div>
		</div>
	);
};
