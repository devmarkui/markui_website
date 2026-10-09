import Link from "next/link";

import Chan from "@/components/site/Chan";
import { Arrow } from "@/components/site/icons";
import VaultTop from "@/components/vault/VaultTop";
import { siteOrigin } from "@/lib/vault/links";

export default function VaultNotFound() {
  return (
    <main id="main" className="sx pg vault">
      <VaultTop siteOrigin={siteOrigin()} back />
      <section className="vt-mast mast ground ground-carbon" data-mast data-ground="carbon" aria-labelledby="nf-title">
        <div className="wrap mast-inner">
          <Chan num="404" className="is-live">
            Not in the Vault
          </Chan>
          <h1 className="mast-title" id="nf-title">
            <span className="mast-q">Nothing</span>{" "}
            <span className="mast-l">
              here<span className="mast-stop">.</span>
            </span>
          </h1>
          <div className="mast-foot">
            <div className="mast-lede">
              <p>This project isn&rsquo;t in the Vault, or its link has changed.</p>
            </div>
            <div className="btn-row">
              <Link className="btn-signal" href="/">
                See every project <Arrow />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
