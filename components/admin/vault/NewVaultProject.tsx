"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createVaultProjectAction } from "@/app/admin/vault-actions";
import { GENERAL_TEMPLATE, TEMPLATES } from "@/lib/vault/templates";

import { Text } from "./fields";

interface Service {
  id: string;
  name: string;
  slug: string;
}

interface MainProject {
  id: string;
  title: string;
  client?: string;
  serviceId?: string;
  linked: boolean;
}

/**
 * Starting a Vault project: pick the service (which sets the starting
 * sections), name it — or start from a project that's already on markui.lk.
 */
export default function NewVaultProject({ services, mainProjects }: { services: Service[]; mainProjects: MainProject[] }) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState("");
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [importFrom, setImportFrom] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const service = services.find((s) => s.id === serviceId);
  const template = TEMPLATES.find((t) => t.key === service?.slug) ?? GENERAL_TEMPLATE;
  const source = mainProjects.find((p) => p.id === importFrom);

  const create = () =>
    start(async () => {
      setError("");
      const res = await createVaultProjectAction({
        title: title || source?.title || "",
        client,
        serviceId,
        template: template.key,
        importFrom: importFrom || undefined,
      });
      if (res.error || !res.id) setError(res.error ?? "The project couldn't be created.");
      else router.push(`/admin/vault/${res.id}`);
    });

  return (
    <div className="vx-new">
      <section className="ad-panel">
        <h2 className="ad-panel-title">1 · What kind of project?</h2>
        <div className="vx-service-grid">
          {services.map((s) => (
            <button
              key={s.id}
              type="button"
              className="vx-service"
              aria-pressed={serviceId === s.id}
              onClick={() => setServiceId(s.id)}
            >
              {s.name}
            </button>
          ))}
          <button type="button" className="vx-service" aria-pressed={serviceId === ""} onClick={() => setServiceId("")}>
            Something else
          </button>
        </div>
        <div className="vx-outline">
          <span className="ad-label">Starts with these sections</span>
          <ol>
            {template.outline.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p className="ad-hint">You can add, remove and reorder sections afterwards.</p>
        </div>
      </section>

      <section className="ad-panel">
        <h2 className="ad-panel-title">2 · Name it</h2>
        <div className="ad-grid">
          <div className="ad-field ad-field--full">
            <label className="ad-label" htmlFor="vx-import">
              Start from a markui.lk project <span>(optional: copies its title, client, cover and text, and links the two)</span>
            </label>
            <select
              id="vx-import"
              value={importFrom}
              onChange={(e) => {
                const id = e.target.value;
                setImportFrom(id);
                const p = mainProjects.find((m) => m.id === id);
                if (p) {
                  setTitle(p.title);
                  setClient(p.client ?? "");
                  if (p.serviceId) setServiceId(p.serviceId);
                }
              }}
            >
              <option value="">No, start blank</option>
              {mainProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                  {p.linked ? " (already has a Vault page)" : ""}
                </option>
              ))}
            </select>
          </div>
          <Text label="Title" value={title} onChange={setTitle} full placeholder="e.g. Colombo Fashion Week 2026" />
          <Text label="Client" hint="optional" value={client} onChange={setClient} />
        </div>
        {error ? <p className="ad-alert ad-alert--error vx-notice">{error}</p> : null}
        <div className="vx-row vx-new-foot">
          <button type="button" className="ad-btn ad-btn--primary" disabled={pending || !(title || source)} onClick={create}>
            {pending ? "Creating…" : "Create as a draft"}
          </button>
        </div>
      </section>
    </div>
  );
}
