import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../auth/AuthContext";
import { api, apiError } from "../../api/client";
import { Button, Card, Field, Input, Select } from "../../components/ui";
import { LANGUAGES } from "../../lib/constants";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const isInstructor = user?.roles?.includes("instructor");
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    locale: user?.locale || "en",
    phone: user?.phone || "",
  });

  async function save(e) {
    e.preventDefault();
    try {
      const payload = {
        fullName: form.fullName,
        locale: form.locale,
      };
      if (isInstructor) payload.phone = form.phone;
      const { data } = await api.put("/auth/profile", payload);
      setUser(data.data.user);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(apiError(err, "Could not update profile."));
    }
  }

  return (
    <Card className="max-w-lg">
      <h1 className="font-serif text-3xl">Profile</h1>
      <form onSubmit={save} className="mt-6 space-y-4">
        <Field label="Name">
          <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </Field>
        {isInstructor ? (
          <Field label="Phone">
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91…"
            />
          </Field>
        ) : null}
        <Field label="Language">
          <Select options={LANGUAGES} value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value })} />
        </Field>
        <p className="text-sm text-sage">{user?.email}</p>
        <Button type="submit">Save</Button>
      </form>
    </Card>
  );
}
