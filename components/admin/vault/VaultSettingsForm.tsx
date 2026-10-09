"use client";

import { useState, useTransition } from "react";

import { saveVaultSettingsAction } from "@/app/admin/vault-actions";
import type { VaultSettings } from "@/lib/vault/types";

import { Area, Text } from "./fields";
import { MediaPickerProvider, MediaSlot } from "./MediaPicker";

export default function VaultSettingsForm({ initial }: { initial: VaultSettings }) {
  const [settings, setSettings] = useState(initial);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = (patch: Partial<VaultSettings>) => setSettings((s) => ({ ...s, ...patch }));

  return (
    <MediaPickerProvider>
      <section className="ad-panel">
        <h2 className="ad-panel-title">The Vault&rsquo;s front page</h2>
        <div className="ad-grid">
          <Text label="Title, quiet part" hint="set light" value={settings.titleQuiet} onChange={(titleQuiet) => set({ titleQuiet })} />
          <Text label="Title, loud part" hint="set bold, with the orange full stop" value={settings.titleLoud} onChange={(titleLoud) => set({ titleLoud })} />
          <Area label="Intro" rows={3} value={settings.intro} onChange={(intro) => set({ intro })} maxLength={400} />
          <Text label="Button label" value={settings.ctaLabel} onChange={(ctaLabel) => set({ ctaLabel })} />
          <Text label="Button link" type="url" value={settings.ctaUrl} onChange={(ctaUrl) => set({ ctaUrl })} />
        </div>
      </section>
      <section className="ad-panel">
        <h2 className="ad-panel-title">Search engines and sharing</h2>
        <div className="ad-grid">
          <Text label="Page title" value={settings.seoTitle} onChange={(seoTitle) => set({ seoTitle })} full maxLength={80} />
          <Area label="Description" rows={2} value={settings.seoDescription} onChange={(seoDescription) => set({ seoDescription })} maxLength={300} />
          <MediaSlot
            label="Sharing image"
            hint="1200×630, shown when the link is shared"
            value={settings.ogImage ? { url: settings.ogImage, kind: "image" } : null}
            accept="image"
            onChange={(ref) => set({ ogImage: ref ? (ref.display ?? ref.url) : "" })}
          />
        </div>
      </section>
      {notice ? <p className={`ad-alert ad-alert--${notice.kind} vx-notice`}>{notice.text}</p> : null}
      <div className="vx-row vx-new-foot">
        <button
          type="button"
          className="ad-btn ad-btn--primary"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await saveVaultSettingsAction(settings);
              setNotice(res.error ? { kind: "error", text: res.error } : { kind: "ok", text: "Saved." });
            })
          }
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </MediaPickerProvider>
  );
}
