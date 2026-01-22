import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ApplicationStepper } from "@/components/application/ApplicationStepper";

export default function ApplicationPage() {
  const { user, profile, application, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
    // If user already has an application, redirect to dashboard
    if (!loading && application) {
      navigate("/dashboard");
    }
  }, [user, application, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ApplicationStepper
      userData={{
        firstName: profile?.first_name || "",
        lastName: profile?.last_name || "",
        email: profile?.email || user.email || "",
        phone: profile?.phone || "",
      }}
    />
  );
}
