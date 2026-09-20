import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../auth/AuthContext";
import { Button, Field, Input, Select } from "../../components/ui";
import { apiError } from "../../api/client";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "student",
  });

  async function onSubmit(e) {
    e.preventDefault();
    if (form.fullName.trim().length < 2) return toast.error("Please enter your name.");
    if (form.password.length < 8) return toast.error("Password must be at least 8 characters.");
    try {
      const user = await register(form);
      navigate(
        user.roles?.includes("admin")
          ? "/admin"
          : user.roles?.includes("instructor")
            ? "/instructor/dashboard"
            : "/dashboard"
      );
    } catch (err) {
      toast.error(apiError(err, "Could not create account."));
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="font-serif text-4xl">Join Yoga Studio</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-[2rem] bg-white p-6 shadow-soft">
        <Field label="Name">
          <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </Field>
        <Field label="Password">
          <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </Field>
        <Field label="I am a">
          <Select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            options={[
              { id: "student", label: "Student" },
              { id: "instructor", label: "Instructor" },
            ]}
          />
        </Field>
        <Button type="submit" className="w-full">Create account</Button>
      </form>
      <p className="mt-6 text-center text-sm">
        Already have an account? <Link to="/login" className="underline">Sign in</Link>
      </p>
    </div>
  );
}
