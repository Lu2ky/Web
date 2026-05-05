import { useOnboardingContextSafe } from "../context/OnboardingContext";

export default function useOnboarding() {
	return useOnboardingContextSafe();
}
