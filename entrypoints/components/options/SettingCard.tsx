import { SettingCardProps } from "@/types";

export default function SettingCard({
	title,
	desc,
	children,
}: SettingCardProps) {
	return (
		<div className="p-6 space-y-4">
			<div className="flex items-center justify-between p-4 bg-[#f8f8f836] dark:hover:bg-[#15191f] rounded-xl backdrop-blur-md hover:bg-[#fbfdf4] dark:bg-[#131416] transition-colors border border-gray-100 dark:border-white/10">
				<div>
					<h3 className="font-medium capitalize text-[15px] text-gray-900 dark:text-white">
						{title}
					</h3>
					<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
						{desc}
					</p>
				</div>
				{children}
			</div>
		</div>
	);
}
