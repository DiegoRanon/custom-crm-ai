"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Stage } from "@prisma/client";
import { ArrowLeft, Save, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { STAGES } from "@/types/types";

export default function CreateLeadPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [source, setSource] = useState("");
  const [stage, setStage] = useState<Stage>(Stage.New);
  const [estimatedValue, setEstimatedValue] = useState("0");
  const [description, setDescription] = useState("");
  const [lastContactedAt, setLastContactedAt] = useState("");

  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
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
        const message = data.message || "Unable to create lead.";
        setError(message);
        toast.error(message);
        return;
      }

      toast.success("Lead created successfully.");
      router.replace(`/leads/${data.lead.id}`);
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
    <div className="space-y-8">
      <section>
        <Link
          href="/leads"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to leads
        </Link>

        <div className="mt-4">
          <p className="text-sm font-medium text-slate-500">Lead Management</p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Create Lead
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Add a new opportunity to your CRM pipeline and start tracking its
            progress.
          </p>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Lead Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Fill in the core details for this new lead.
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
              placeholder="Sarah Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
          </FormField>

          <FormField label="Email address" htmlFor="email" required>
            <input
              id="email"
              type="email"
              placeholder="sarah@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
          </FormField>

          <FormField label="Phone" htmlFor="phone">
            <input
              id="phone"
              type="text"
              placeholder="514-555-1234"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
          </FormField>

          <FormField label="Company" htmlFor="company">
            <input
              id="company"
              type="text"
              placeholder="ABC Fitness"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
          </FormField>

          <FormField label="Source" htmlFor="source" required>
            <input
              id="source"
              type="text"
              placeholder="Via website form"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
          </FormField>

          <FormField label="Pipeline stage" htmlFor="stage" required>
            <select
              id="stage"
              value={stage}
              onChange={(e) => setStage(e.target.value as Stage)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
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
              placeholder="4000"
              value={estimatedValue}
              onChange={(e) => setEstimatedValue(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
          </FormField>

          <FormField label="Last contacted" htmlFor="lastContactedAt">
            <input
              id="lastContactedAt"
              type="date"
              value={lastContactedAt}
              onChange={(e) => setLastContactedAt(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
          </FormField>

          <div className="md:col-span-2">
            <FormField label="Description" htmlFor="description">
              <textarea
                id="description"
                placeholder="Add context, pain points, budget, next steps, or notes about this lead."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
            </FormField>
          </div>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
          <Link
            href="/leads"
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
            {isSaving ? "Creating..." : "Create Lead"}
          </button>
        </div>
      </form>
    </div>
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
