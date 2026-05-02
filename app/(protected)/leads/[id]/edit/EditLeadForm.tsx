"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Stage } from "@prisma/client";
import { Save, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { STAGES } from "@/types/types";

type EditLeadFormProps = {
  lead: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    company: string | null;
    source: string;
    stage: Stage;
    estimatedValue: number;
    description: string | null;
    lastContactedAt: string | null;
  };
};

function formatDateForInput(date: string | null) {
  if (!date) return "";

  return new Date(date).toISOString().split("T")[0];
}

export function EditLeadForm({ lead }: EditLeadFormProps) {
  const router = useRouter();

  const [name, setName] = useState(lead.name);
  const [email, setEmail] = useState(lead.email);
  const [phone, setPhone] = useState(lead.phone ?? "");
  const [company, setCompany] = useState(lead.company ?? "");
  const [source, setSource] = useState(lead.source);
  const [stage, setStage] = useState<Stage>(lead.stage);
  const [estimatedValue, setEstimatedValue] = useState(
    String(lead.estimatedValue),
  );
  const [description, setDescription] = useState(lead.description ?? "");
  const [lastContactedAt, setLastContactedAt] = useState(
    formatDateForInput(lead.lastContactedAt),
  );

  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone: phone || null,
          company: company || null,
          source,
          stage,
          estimatedValue: Number(estimatedValue),
          description: description || null,
          lastContactedAt: lastContactedAt || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data.message || "Unable to update lead.";
        setError(message);
        toast.error(message);
        return;
      }

      toast.success("Lead updated successfully.");
      router.replace(`/leads/${lead.id}`);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";

      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Lead Information
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Keep this lead profile accurate so your pipeline analytics stay
          useful.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="Full name" htmlFor="name" required>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="input"
          />
        </FormField>

        <FormField label="Email address" htmlFor="email" required>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input"
          />
        </FormField>

        <FormField label="Phone" htmlFor="phone">
          <input
            id="phone"
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="514-555-1234"
            className="input"
          />
        </FormField>

        <FormField label="Company" htmlFor="company">
          <input
            id="company"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company name"
            className="input"
          />
        </FormField>

        <FormField label="Source" htmlFor="source" required>
          <input
            id="source"
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Source of the lead"
            className="input"
          />
        </FormField>

        <FormField label="Pipeline stage" htmlFor="stage" required>
          <select
            id="stage"
            value={stage}
            onChange={(e) => setStage(e.target.value as Stage)}
            required
            className="input"
          >
            {STAGES.map((stageOption) => (
              <option key={stageOption} value={stageOption}>
                {stageOption}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Estimated value" htmlFor="estimatedValue" required>
          <input
            id="estimatedValue"
            type="number"
            min="0"
            step="1"
            value={estimatedValue}
            onChange={(e) => setEstimatedValue(e.target.value)}
            required
            className="input"
          />
        </FormField>

        <FormField label="Last contacted" htmlFor="lastContactedAt">
          <input
            id="lastContactedAt"
            type="date"
            value={lastContactedAt}
            onChange={(e) => setLastContactedAt(e.target.value)}
            className="input"
          />
        </FormField>

        <div className="md:col-span-2">
          <FormField label="Description" htmlFor="description">
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Add context, pain points, next steps, or notes about this opportunity."
              className="input resize-none"
            />
          </FormField>
        </div>
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
        <Link
          href={`/leads/${lead.id}`}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <X className="h-4 w-4" />
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

function FormField({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>

      {children}
    </div>
  );
}
