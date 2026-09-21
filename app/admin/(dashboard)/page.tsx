import Link from "next/link";

import { requireAdmin } from "@/lib/auth";
import {
  getProducts,
  getProjects,
  getServices,
  getSettings,
  getTopWork,
} from "@/lib/db";

export default async function AdminOverviewPage() {
  await requireAdmin("/admin");

  const [services, topWork, products, projects, settings] = await Promise.all([
    getServices({ includeInactive: true }),
    getTopWork(),
    getProducts({ includeInactive: true }),
    getProjects({ includeInactive: true }),
    getSettings(),
  ]);

  const liveServices = services.filter((s) => s.active);
  const servicesWithoutWork = liveServices.filter(
    (s) => !topWork.some((w) => w.serviceId === s.id && w.active),
  );
  const missingProjectImages = projects.filter((p) => !p.image).length;

  return (
    <>
      <div className="ad-page-head">
        <div>
          <h1 className="ad-title">Dashboard</h1>
          <p className="ad-subtitle">
            Manage what appears on the public website. Anything you add, edit or
            delete here shows up on the live site immediately — no code changes
            needed.
          </p>
        </div>
      </div>

      <div className="ad-stats">
        <div className="ad-stat">
          <div className="ad-stat-value">{liveServices.length}</div>
          <div className="ad-stat-label">Live services</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat-value">{topWork.length}</div>
          <div className="ad-stat-label">Top work items</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat-value">{products.length}</div>
          <div className="ad-stat-label">Products</div>
        </div>
        <div className="ad-stat">
          <div className="ad-stat-value">{projects.length}</div>
          <div className="ad-stat-label">Projects</div>
        </div>
      </div>

      {/* Things worth acting on, surfaced rather than buried. */}
      {!settings.portfolioUrl ? (
        <div className="ad-alert ad-alert--note">
          No portfolio website is configured, so the{" "}
          <strong>Check our portfolio</strong> button is hidden on every service
          page.{" "}
          <Link href="/admin/settings" style={{ textDecoration: "underline" }}>
            Add the address
          </Link>{" "}
          to switch it on.
        </div>
      ) : null}

      {products.length === 0 ? (
        <div className="ad-alert ad-alert--note">
          There are no products yet, so the public Products page shows a
          &ldquo;coming soon&rdquo; message.{" "}
          <Link href="/admin/products" style={{ textDecoration: "underline" }}>
            Add your first product
          </Link>
          .
        </div>
      ) : null}

      {servicesWithoutWork.length ? (
        <div className="ad-alert ad-alert--note">
          {servicesWithoutWork.length}{" "}
          {servicesWithoutWork.length === 1 ? "service has" : "services have"}{" "}
          no Top Work yet ({servicesWithoutWork.map((s) => s.name).join(", ")}),
          so that section is hidden on{" "}
          {servicesWithoutWork.length === 1 ? "its page" : "their pages"}.{" "}
          <Link href="/admin/top-work" style={{ textDecoration: "underline" }}>
            Add some
          </Link>
          .
        </div>
      ) : null}

      {missingProjectImages > 0 ? (
        <div className="ad-alert ad-alert--note">
          {missingProjectImages}{" "}
          {missingProjectImages === 1 ? "project has" : "projects have"} no
          image and show a placeholder.{" "}
          <Link href="/admin/projects" style={{ textDecoration: "underline" }}>
            Upload images
          </Link>
          .
        </div>
      ) : null}

      <div className="ad-panel">
        <div className="ad-panel-title">Manage content</div>
        <div className="ad-quick-links">
          <Link className="ad-btn ad-btn--primary" href="/admin/services">
            Services
          </Link>
          <Link className="ad-btn" href="/admin/top-work">
            Service top work
          </Link>
          <Link className="ad-btn" href="/admin/products">
            Products
          </Link>
          <Link className="ad-btn" href="/admin/projects">
            Projects
          </Link>
          <Link className="ad-btn" href="/admin/settings">
            Portfolio settings
          </Link>
        </div>
      </div>

      <div className="ad-panel">
        <div className="ad-panel-title">Services and their top work</div>
        {services.length === 0 ? (
          <p className="ad-hint">No services yet.</p>
        ) : (
          <div className="ad-list">
            {services.map((service) => {
              const count = topWork.filter(
                (w) => w.serviceId === service.id,
              ).length;
              return (
                <div className="ad-item" key={service.id}>
                  <div className="ad-thumb">
                    <div className="ad-thumb-empty" aria-hidden="true">
                      {service.icon || service.name.slice(0, 1)}
                    </div>
                  </div>
                  <div className="ad-item-body">
                    <div className="ad-item-title">
                      {service.name}
                      <span
                        className={`ad-status ad-status--${service.active ? "on" : "off"}`}
                      >
                        {service.active ? "Live" : "Hidden"}
                      </span>
                    </div>
                    <div className="ad-item-meta">
                      <span>/services/{service.slug}</span>
                      <span>
                        {count} top work {count === 1 ? "item" : "items"}
                      </span>
                    </div>
                  </div>
                  <div className="ad-item-actions">
                    <Link
                      className="ad-btn ad-btn--sm"
                      href={`/admin/top-work?service=${service.id}`}
                    >
                      Manage top work
                    </Link>
                    <Link
                      className="ad-btn ad-btn--sm"
                      href={`/services/${service.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View ↗
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="ad-panel">
        <div className="ad-panel-title">Public pages</div>
        <div className="ad-quick-links">
          <Link
            className="ad-btn"
            href="/products-services"
            target="_blank"
            rel="noopener noreferrer"
          >
            Products &amp; Services ↗
          </Link>
          <Link
            className="ad-btn"
            href="/products"
            target="_blank"
            rel="noopener noreferrer"
          >
            Products ↗
          </Link>
          <Link
            className="ad-btn"
            href="/services"
            target="_blank"
            rel="noopener noreferrer"
          >
            Services ↗
          </Link>
          <Link
            className="ad-btn"
            href="/projects"
            target="_blank"
            rel="noopener noreferrer"
          >
            Projects ↗
          </Link>
        </div>
      </div>
    </>
  );
}
