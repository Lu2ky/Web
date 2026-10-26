import { useParams } from "react-router-dom";
import { OnboardingProvider } from "../../features/onboarding/model/OnboardingContext";
import StudentView from "../../pages/student/StudentPage";

export default function AppOnboarding() {
	const { userId } = useParams();

	return (
		<OnboardingProvider userId={userId}>
			<StudentView />
		</OnboardingProvider>
	);
}