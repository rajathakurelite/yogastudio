import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../auth/AuthContext";
import { Button, Field, Input } from "../../components/ui";
import { apiError } from "../../api/client";

export default function LoginPage() {
  const { login, homePath } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("student@yogastudio.local");
  const [password, setPassword] = useState("DemoPass123!");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email and password are required.");
      return;
    }
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.fullName}`);
      navigate(homePath());
    } catch (err) {
      toast.error(apiError(err, "Could not sign in."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <p className="text-xs uppercase tracking-[0.3em] text-sage">Yoga Studio</p>
      <h1 className="mt-3 font-serif text-4xl">Welcome back</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-[2rem] bg-white p-6 shadow-soft">
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Password">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-sage">
        New here? <Link to="/register" className="text-sage-deep underline">Create an account</Link>
      </p>
    </div>
  );
}
