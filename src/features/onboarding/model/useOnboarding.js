import { useOnboardingContextSafe } from "./OnboardingContext";

export default function useOnboarding() {
	return useOnboardingContextSafe();
}
