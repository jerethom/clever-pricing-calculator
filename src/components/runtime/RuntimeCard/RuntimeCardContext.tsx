import { createContext, useContext } from "react";
import type { RuntimeCardContextValue } from "./types";

export const RuntimeCardContext = createContext<RuntimeCardContextValue | null>(
	null,
);

export function useRuntimeCardContext(): RuntimeCardContextValue {
	const context = useContext(RuntimeCardContext);
	if (!context) {
		throw new Error(
			"useRuntimeCardContext must be used within a RuntimeCardProvider",
		);
	}
	return context;
}
