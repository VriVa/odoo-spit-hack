import { SignIn } from "@clerk/clerk-react";

export default function LoginPage() {
  return (
    <div className="flex justify-center mt-10">
      <SignIn path="/sign-in" routing="path" />
    </div>
  );
}
