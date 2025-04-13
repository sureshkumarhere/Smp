import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setLoading } from "../../redux/slices/conditionSlice";

const Loading = () => {
	const dispatch = useDispatch();
	const [showCancel, setShowCancel] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setShowCancel(true), 10000);
		return () => clearTimeout(timer);
	}, []);

	return (
		<div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm text-slate-200">
			{/* Spinner */}
			<div className="w-14 h-14 border-4 border-t-transparent border-slate-400 rounded-full animate-spin" />

			{/* Cancel Button */}
			{showCancel && (
				<div className="mt-6">
					<button
						onClick={() => dispatch(setLoading(false))}
						className="py-2 px-5 font-semibold rounded-md border border-slate-600 bg-slate-800 hover:bg-black transition-all"
					>
						Cancel
					</button>
				</div>
			)}
		</div>
	);
};

export default Loading;
