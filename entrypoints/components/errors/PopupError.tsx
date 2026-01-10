import PopupSkeleton from "../skeletons/PopupSkeleton";

interface PopupErrorProps {
	msg: string;
	clickFn: () => void;
}
export default function PopupError({ msg, clickFn }: PopupErrorProps) {
	return (
		<div className="relative">
			<PopupSkeleton />
			<div className="absolute top-0 left-0 h-full w-full flex justify-center items-center backdrop-blur-md bg-black/60">
				<div className="w-full">
					<p className="text-red-400 text-center text-sm text-shadow-md font-semibold">
						Error: {msg}
					</p>
					<button
						onClick={clickFn}
						className="block mt-6 px-8 py-3 mx-auto bg-red-500 hover:bg-red-600 text-white font-semibold text-sm rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
					>
						Retry
					</button>
				</div>
			</div>
		</div>
	);
}
