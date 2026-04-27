import { useParams } from "react-router-dom";
import { OnboardingProvider } from "../context/OnboardingContext";
import StudentView from "./StudentView";

export default function AppOnboarding() {
	const { userId } = useParams();

	return (
		<OnboardingProvider userId={userId}>
			<StudentView />
		</OnboardingProvider>
	);
}