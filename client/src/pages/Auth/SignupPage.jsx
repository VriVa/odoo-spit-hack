import { SignUp } from "@clerk/clerk-react";

export default function SignupPage() {
  return (
    <div className="flex justify-center mt-10">
      <SignUp path="/sign-up" routing="path" />
    </div>
  );
}
