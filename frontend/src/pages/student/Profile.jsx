import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../auth/AuthContext";
import { api, apiError } from "../../api/client";
import { Button, Card, Field, Input, Select } from "../../components/ui";
import { LANGUAGES } from "../../lib/constants";

export default function ProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    locale: user?.locale || "en",
  });

  async function save(e) {
    e.preventDefault();
    try {
      const { data } = await api.put("/auth/profile", form);
      localStorage.setItem("yoga_user", JSON.stringify(data.data.user));
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
        <Field label="Language">
          <Select options={LANGUAGES} value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value })} />
        </Field>
        <p className="text-sm text-sage">{user?.email}</p>
        <Button type="submit">Save</Button>
      </form>
    </Card>
  );
}
