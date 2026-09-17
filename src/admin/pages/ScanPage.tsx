import Button from '@shared/ui/Button';
import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';
import { formatCurrency } from '@utils/currency';
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PhotoCapture from '../PhotoCapture';
import { useAdminAuth } from '../auth';
import { mainWebsiteUrl } from '../config';
import { fadeIn } from '../retail/cameraFeedback';
import { normalizeImportedDescription, normalizeImportedTitle } from '../retail/importNormalize';
import {
  canonicalizeBarcode,
  createIntakeUploadUrls,
  createRetailCategory,
  createRetailProduct,
  fetchBarcodeInfo,
  fetchIntakeDrafts,
  fetchRetailCategories,
  fetchRetailProductByBarcode,
  isAuthError,
  patchRetailProduct,
  receiveRetailStock,
  uploadIntakePhoto,
  type BarcodeInfo,
  type IntakeDraft,
  type IntakeShot,
  type RetailCategory,
  type RetailProduct,
} from '../retail/retailApi';
import { inputStyle, labelStyle } from '../styles';
import '../scan-flow.css';

// Lazy: the scanner drags in the zxing WASM decoder (~1MB); load it only when
// staff actually open the camera.
const BarcodeScanner = lazy(() => import('../retail/BarcodeScanner'));

type ScanState =
  | { mode: 'scanning' }
  | { mode: 'lookup'; barcode: string }
  | { mode: 'found'; product: RetailProduct }
  | {
      mode: 'unknown';
      barcode: string;
      hint: BarcodeInfo;
      categoryId?: string;
      /** Shots already in the bucket when resuming a draft (#23). */
      draftShots?: IntakeShot[];
    };

// "Sep 17, 3:14 PM" — when the draft's last photo was taken.
function draftWhen(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * `/scan` — the default surface, zero-tap (#18a): the camera opens the moment
 * the page renders; there is no idle screen and no Cancel on the scanner.
 * Known barcode → receive stock. Unknown barcode splits on the barcode-DB
 * lookup (#19): DB hit → the create form directly (no photos); DB miss →
 * guided front/back capture screens, then the form. Finishing a product
 * drops straight back onto the live scanner.
 */
export default function ScanPage() {
  const { onAuthExpired } = useAdminAuth();
  const [categories, setCategories] = useState<RetailCategory[]>([]);
  const [scan, setScan] = useState<ScanState>({ mode: 'scanning' });
  const [notice, setNotice] = useState<string | null>(null);

  // Entrance half of the scan ritual (#21): the scanner fades out on detect,
  // the lookup card fades in.
  const lookupRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (scan.mode === 'lookup') fadeIn(lookupRef.current);
  }, [scan.mode]);

  useEffect(() => {
    let cancelled = false;
    fetchRetailCategories()
      .then((cats) => {
        if (!cancelled) setCategories(cats);
      })
      .catch((err) => {
        if (isAuthError(err)) onAuthExpired();
        // Otherwise: the create form simply starts without category options.
      });
    return () => {
      cancelled = true;
    };
  }, [onAuthExpired]);

  const handleNewCategory = useCallback((cat: RetailCategory) => {
    setCategories((prev) => (prev.some((c) => c.id === cat.id) ? prev : [...prev, cat]));
  }, []);

  const handleDetected = useCallback(
    async (raw: string) => {
      // Canonical GTIN (#23): UPC-A and EAN-13 spellings of one label must
      // resolve to the same product, keys, and draft.
      const code = canonicalizeBarcode(raw);
      setNotice(null); // a stale success banner shouldn't ride over a new product
      setScan({ mode: 'lookup', barcode: code });
      try {
        const product = await fetchRetailProductByBarcode(code);
        if (product) {
          setScan({ mode: 'found', product });
          return;
        }
        const [hint, draftShots] = await Promise.all([
          fetchBarcodeInfo(code),
          // Scan-path draft resume (#24): a fresh server check, so photos
          // taken seconds ago — even on another phone — count too.
          fetchIntakeDrafts()
            .then((all) => all.find((d) => d.barcode === code)?.shots)
            .catch(() => undefined),
        ]);
        // Match an EXISTING shop category from the database's category path —
        // never auto-create categories on scan (junk-category regression).
        let categoryId: string | undefined;
        if (hint.category) {
          const path = hint.category.toLowerCase();
          categoryId = categories.find((c) => path.includes(c.title.toLowerCase()))?.id;
        }
        setScan({ mode: 'unknown', barcode: code, hint, categoryId, draftShots });
      } catch (err) {
        if (isAuthError(err)) {
          onAuthExpired();
          return;
        }
        setScan({ mode: 'unknown', barcode: code, hint: {} });
      }
    },
    [onAuthExpired, categories],
  );

  // Every exit path lands back on the live scanner — there is no idle screen.
  const backToScanner = useCallback(() => setScan({ mode: 'scanning' }), []);

  // Drafts (#23): unfinished photo-flow items, derived server-side from the
  // bucket. Refreshes every time the scanner comes back up.
  const [drafts, setDrafts] = useState<IntakeDraft[]>([]);
  useEffect(() => {
    if (scan.mode !== 'scanning') return;
    let cancelled = false;
    fetchIntakeDrafts()
      .then((d) => {
        if (!cancelled) setDrafts(d);
      })
      .catch((err) => {
        if (isAuthError(err)) onAuthExpired();
        // Otherwise: the drafts card simply doesn't render this visit.
      });
    return () => {
      cancelled = true;
    };
  }, [scan.mode, onAuthExpired]);

  const resumeDraft = useCallback((draft: IntakeDraft) => {
    setNotice(null);
    setScan({ mode: 'unknown', barcode: draft.barcode, hint: {}, draftShots: draft.shots });
  }, []);

  return (
    <Section>
      <Container>
        <div className="inner-container _580px center admin-scan-flow">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {scan.mode === 'scanning' && notice ? (
              <div className="card" role="status" style={{ padding: '0.75rem 1rem' }}>
                <p className="paragraph-small" style={{ margin: 0 }}>
                  {notice}{' '}
                  <a
                    href={`${mainWebsiteUrl()}/shop`}
                    className="link"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cta-id="admin-view-shop"
                  >
                    View shop
                  </a>
                </p>
              </div>
            ) : null}
            {scan.mode === 'scanning' ? (
              <Suspense
                fallback={
                  <div className="card checkout-block" style={{ padding: '1.25rem' }}>
                    <p className="paragraph-small" style={{ margin: 0 }}>
                      Opening the scanner…
                    </p>
                  </div>
                }
              >
                <BarcodeScanner onDetected={handleDetected} />
              </Suspense>
            ) : null}
            {scan.mode === 'scanning' && drafts.length > 0 ? (
              <div className="card checkout-block" style={{ padding: '1.25rem' }}>
                <h2 className="display-7" style={{ marginTop: 0 }}>
                  Continue where you left off
                </h2>
                <ul role="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {drafts.map((draft) => (
                    <li key={draft.barcode} style={{ borderBottom: '1px solid #eee' }}>
                      <button
                        type="button"
                        className="button-reset"
                        onClick={() => resumeDraft(draft)}
                        data-cta-id={`admin-draft-${draft.barcode}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 12,
                          width: '100%',
                          textAlign: 'left',
                          padding: '12px 0',
                        }}
                      >
                        <span className="paragraph-small" style={{ fontWeight: 600 }}>
                          ‖ {draft.barcode}
                        </span>
                        <span className="paragraph-small" style={{ opacity: 0.7 }}>
                          {draft.shots.length}/2 photos · {draftWhen(draft.lastModified)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {scan.mode === 'lookup' ? (
              <div ref={lookupRef} className="card checkout-block" style={{ padding: '1.25rem' }}>
                <p className="paragraph-small" style={{ margin: 0 }}>
                  Looking up {scan.barcode}…
                </p>
              </div>
            ) : null}
            {scan.mode === 'found' ? (
              <ReceiveCard
                product={scan.product}
                onDone={(msg) => {
                  if (msg) setNotice(msg);
                  backToScanner();
                }}
                onScanAgain={backToScanner}
                onAuthExpired={onAuthExpired}
              />
            ) : null}
            {scan.mode === 'unknown' ? (
              <CreateProductCard
                barcode={scan.barcode}
                hint={scan.hint}
                draftShots={scan.draftShots}
                resolvedCategoryId={scan.categoryId}
                categories={categories}
                onNewCategory={handleNewCategory}
                onDone={(msg) => {
                  if (msg) setNotice(msg);
                  backToScanner();
                }}
                onScanAgain={backToScanner}
                onCancel={backToScanner}
                onAuthExpired={onAuthExpired}
              />
            ) : null}
          </div>
        </div>
      </Container>
    </Section>
  );
}

function ReceiveCard({
  product,
  onDone,
  onScanAgain,
  onAuthExpired,
}: {
  product: RetailProduct;
  onDone: (notice: string | null) => void;
  onScanAgain: () => void;
  onAuthExpired: () => void;
}) {
  const [qty, setQty] = useState('1');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [received, setReceived] = useState<number | null>(null);

  const qtyNum = /^\d+$/.test(qty) ? Number(qty) : 0;

  return (
    <div className="card checkout-block" style={{ padding: '1.25rem' }}>
      <h2 className="display-7" style={{ marginTop: 0 }}>
        {product.title}
      </h2>
      <p className="paragraph-small mg-top-8px" style={{ margin: 0 }}>
        {formatCurrency(product.priceCents)} · {product.sku || 'no SKU'}
        {product.category ? ` · ${product.category.title}` : ''}
      </p>
      <p className="paragraph-small mg-top-8px">
        {product.stock
          ? `In stock: ${product.stock.available} available (${product.stock.onHand} on hand)`
          : 'Stock: —'}
      </p>
      {received !== null ? (
        <p role="status" className="paragraph-small mg-top-12px" style={{ fontWeight: 600 }}>
          Received {received} ✓
        </p>
      ) : (
        <div
          className="mg-top-12px"
          style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}
        >
          <input
            aria-label={`Receive quantity for ${product.title}`}
            style={{ ...inputStyle, width: 90 }}
            inputMode="numeric"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
          <Button
            disabled={busy || !product.sku || qtyNum < 1}
            data-cta-id="admin-scan-receive"
            onClick={async () => {
              setError(null);
              setBusy(true);
              try {
                await receiveRetailStock(product.sku!, qtyNum);
                setReceived(qtyNum);
              } catch (err) {
                if (isAuthError(err)) {
                  onAuthExpired();
                  return;
                }
                setError(
                  err instanceof Error && err.message ? err.message : 'Could not receive stock.',
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? 'Receiving…' : 'Receive'}
          </Button>
        </div>
      )}
      {!product.sku ? (
        <p className="paragraph-small mg-top-8px" style={{ color: '#b91c1c' }}>
          This product has no SKU, so stock can’t be received.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="paragraph-small mg-top-8px" style={{ color: '#b91c1c' }}>
          {error}
        </p>
      ) : null}
      <div className="mg-top-16px" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Button variant="white" onClick={onScanAgain} data-cta-id="admin-scan-next">
          Scan next
        </Button>
        <Button
          variant="link"
          onClick={() =>
            onDone(received !== null ? `Received ${received} × “${product.title}”.` : null)
          }
          data-cta-id="admin-scan-done"
        >
          Done
        </Button>
      </div>
    </div>
  );
}

/**
 * Everything-in-one-place create (spec §5, split by #19): a barcode-DB hit
 * renders the FULL form directly — no photos, the DB already identifies the
 * product. A DB miss walks the guided capture screens (front, then back;
 * shots upload the moment they're taken, #23) and renders a form stripped to
 * barcode + quantity + the photos (#22) — the AI enrichment pipeline owns
 * the rest, so the barcode stands in as the title, the price stays $0, and
 * the product is always created hidden. Submit runs re-send-missing-shots →
 * create-hidden → receive-stock → apply-visibility (full form only); a
 * mid-sequence failure keeps the card open with inline retry that resumes
 * from the first incomplete step, so a product can never be silently
 * stranded. A resumed draft (#23) starts with its bucket shots pre-marked.
 */
function CreateProductCard({
  barcode: initialBarcode,
  hint,
  draftShots,
  resolvedCategoryId,
  categories,
  onNewCategory,
  onDone,
  onScanAgain,
  onCancel,
  onAuthExpired,
}: {
  barcode: string;
  hint: BarcodeInfo;
  /** Shots already in the bucket when resuming a draft (#23). */
  draftShots?: IntakeShot[];
  resolvedCategoryId?: string;
  categories: RetailCategory[];
  onNewCategory: (cat: RetailCategory) => void;
  onDone: (notice: string | null) => void;
  onScanAgain: () => void;
  onCancel: () => void;
  onAuthExpired: () => void;
}) {
  const hintTitle = hint.title || hint.brand || '';
  // Flow split (#19): a barcode-info hit ALWAYS carries `title` (core-api
  // drops title-less upstream results), so no title = DB miss = photos.
  const needsPhotos = !hint.title;

  const [barcode, setBarcode] = useState(initialBarcode);
  const [title, setTitle] = useState(hintTitle ? normalizeImportedTitle(hintTitle) : '');
  const [price, setPrice] = useState(
    hint.suggestedPriceCents ? (hint.suggestedPriceCents / 100).toFixed(2) : '',
  );
  const [qty, setQty] = useState('1');
  const [showOnWebsite, setShowOnWebsite] = useState(false);
  const [categoryId, setCategoryId] = useState(resolvedCategoryId ?? '');
  const [description, setDescription] = useState(
    hint.description ? normalizeImportedDescription(hint.description) : '',
  );
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);

  // Intake photos (DB-miss flow only): front + back (ingredients visible),
  // taken on the guided capture screens — the AI enrichment pipeline consumes
  // them from intake/<barcode>/ later. They are never shop imagery.
  const [photos, setPhotos] = useState<{ front: File | null; back: File | null }>({
    front: null,
    back: null,
  });
  // Which capture screen is up; the form renders only when null. A DB miss
  // starts on the first MISSING shot (a resumed draft may already have some);
  // a retake re-enters one screen from the form.
  const missingAtStart = (['front', 'back'] as const).filter(
    (s) => !(draftShots ?? []).includes(s),
  );
  const [capturing, setCapturing] = useState<IntakeShot | null>(
    needsPhotos ? (missingAtStart[0] ?? null) : null,
  );
  // Upload markers are keyed to the barcode they were uploaded under, so
  // editing the barcode after a partial upload re-uploads under the new key.
  // A resumed draft (#23) starts with its bucket shots already marked.
  const [uploadedShots, setUploadedShots] = useState<{ barcode: string; shots: IntakeShot[] }>({
    barcode: draftShots?.length ? initialBarcode : '',
    shots: draftShots ?? [],
  });

  // Pipeline markers — retry resumes from the first incomplete step.
  const [created, setCreated] = useState<RetailProduct | null>(null);
  const [receivedQty, setReceivedQty] = useState<number | null>(null);
  const [published, setPublished] = useState(false);
  const [donePanel, setDonePanel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // jsdom has no createObjectURL; previews just don't render there.
  const frontPreview = useMemo(
    () =>
      photos.front && typeof URL.createObjectURL === 'function'
        ? URL.createObjectURL(photos.front)
        : null,
    [photos.front],
  );
  const backPreview = useMemo(
    () =>
      photos.back && typeof URL.createObjectURL === 'function'
        ? URL.createObjectURL(photos.back)
        : null,
    [photos.back],
  );
  useEffect(
    () => () => {
      if (frontPreview) URL.revokeObjectURL(frontPreview);
    },
    [frontPreview],
  );
  useEffect(
    () => () => {
      if (backPreview) URL.revokeObjectURL(backPreview);
    },
    [backPreview],
  );

  // A shot counts when a local file exists OR it already landed in the
  // bucket under the CURRENT barcode (capture-time uploads / drafts, #23).
  const shotPresent = (s: IntakeShot) =>
    Boolean(photos[s]) ||
    (uploadedShots.barcode === barcode.trim() && uploadedShots.shots.includes(s));

  // Capture-time upload (#23): the shot survives a killed browser as a
  // draft. Failures stay quiet — submit's safety net re-sends missing shots.
  async function uploadCapturedShot(bc: string, shot: IntakeShot, file: File) {
    try {
      const targets = await createIntakeUploadUrls(bc, [
        { shot, contentType: file.type || 'image/jpeg' },
      ]);
      await uploadIntakePhoto(targets[0].uploadUrl, file);
      setUploadedShots((prev) =>
        prev.barcode === bc
          ? { barcode: bc, shots: [...prev.shots.filter((s) => s !== shot), shot] }
          : prev.barcode === ''
            ? { barcode: bc, shots: [shot] }
            : prev,
      );
    } catch (err) {
      if (isAuthError(err)) onAuthExpired();
    }
  }

  const handleCaptured = (file: File) => {
    if (!capturing) return;
    const shot = capturing;
    const bc = barcode.trim();
    setPhotos((prev) => ({ ...prev, [shot]: file }));
    // A retaken photo must re-upload even if the old one already landed.
    setUploadedShots((prev) => ({ ...prev, shots: prev.shots.filter((s) => s !== shot) }));
    void uploadCapturedShot(bc, shot, file);
    // Advance to whichever shot is still missing; none missing → the form.
    const other: IntakeShot = shot === 'front' ? 'back' : 'front';
    const otherPresent =
      Boolean(photos[other]) ||
      (uploadedShots.barcode === bc && uploadedShots.shots.includes(other));
    setCapturing(otherPresent ? null : other);
  };

  // Cancel mid-sequence abandons the create back to the scanner (anything
  // already uploaded lives on as a draft); cancel on a retake keeps the
  // current photo and returns to the form.
  const cancelCapture = () => {
    if (shotPresent('front') && shotPresent('back')) setCapturing(null);
    else onCancel();
  };

  // #19: the description box grows to fit its text — no inner scrollbar.
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [description, capturing]);

  // Entrance half of the capture ritual (#21): when the last capture screen
  // hands over to the form, the form fades in.
  const formRef = useRef<HTMLDivElement | null>(null);
  const prevCapturing = useRef(capturing);
  useEffect(() => {
    if (prevCapturing.current && !capturing) fadeIn(formRef.current);
    prevCapturing.current = capturing;
  }, [capturing]);

  const qtyNum = /^\d+$/.test(qty.trim()) ? Number(qty.trim()) : 0;
  // Shop imagery comes from the barcode DB or stays a placeholder until the
  // enrichment pipeline runs — intake photos are never shown to customers.
  const imageUrl = hint.imageUrl || undefined;

  async function submit() {
    setError(null);
    if (!created) {
      if (barcode.trim().length < 4) {
        setError('The barcode must be at least 4 characters.');
        return;
      }
      if (needsPhotos) {
        if (!shotPresent('front') || !shotPresent('back')) {
          setError('Take both photos — the front and the back of the product.');
          return;
        }
      } else {
        const priceCents = Math.round(Number.parseFloat(price) * 100);
        if (!Number.isFinite(priceCents) || priceCents < 0) {
          setError('Enter a price like 45 or 45.50.');
          return;
        }
      }
    }
    if (qtyNum < 1) {
      setError('Quantity must be at least 1 — every product goes in with real stock.');
      return;
    }
    setBusy(true);
    try {
      // Photos upload FIRST (DB-miss flow): "product exists" then implies
      // "photos exist" for the enrichment pipeline. Only shots not yet
      // uploaded under the current barcode are (re)sent — retry never
      // re-uploads what landed.
      if (!created && needsPhotos) {
        const trimmedBarcode = barcode.trim();
        const already = uploadedShots.barcode === trimmedBarcode ? uploadedShots.shots : [];
        const pending = (['front', 'back'] as const).filter((s) => !already.includes(s));
        if (pending.length > 0) {
          const targets = await createIntakeUploadUrls(
            trimmedBarcode,
            pending.map((shot) => ({
              shot,
              contentType: photos[shot]!.type || 'image/jpeg',
            })),
          );
          for (const target of targets) {
            await uploadIntakePhoto(target.uploadUrl, photos[target.shot]!);
            setUploadedShots((prev) =>
              prev.barcode === trimmedBarcode
                ? { barcode: trimmedBarcode, shots: [...prev.shots, target.shot] }
                : { barcode: trimmedBarcode, shots: [target.shot] },
            );
          }
        }
      }
      let product = created;
      if (!product) {
        const trimmedBarcode = barcode.trim();
        // Created hidden regardless of the toggle; visibility is applied only
        // after stock lands, so a failure can never leave a visible
        // zero-stock product.
        if (needsPhotos) {
          // #22: the AI pipeline owns the details — the barcode stands in as
          // the title and the price stays $0 until enrichment.
          product = await createRetailProduct({
            title: trimmedBarcode,
            priceCents: 0,
            barcode: trimmedBarcode,
            active: false,
          });
        } else {
          const priceCents = Math.round(Number.parseFloat(price) * 100);
          product = await createRetailProduct({
            title: title.trim(),
            priceCents,
            barcode: trimmedBarcode,
            categoryId: categoryId || undefined,
            imageUrl,
            description: description.trim() || undefined,
            active: false,
          });
        }
        setCreated(product);
      }
      if (receivedQty === null) {
        await receiveRetailStock(product.sku!, qtyNum);
        setReceivedQty(qtyNum);
      }
      if (!needsPhotos && showOnWebsite && !published) {
        await patchRetailProduct(product.slug, { active: true });
        setPublished(true);
      }
      setDonePanel(true);
    } catch (err) {
      if (isAuthError(err)) {
        onAuthExpired();
        return;
      }
      setError(err instanceof Error && err.message ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  if (capturing) {
    return <PhotoCapture shot={capturing} onCapture={handleCaptured} onCancel={cancelCapture} />;
  }

  if (donePanel && created) {
    return (
      <div className="card checkout-block" style={{ padding: '1.25rem' }}>
        <p role="status" className="paragraph-large" style={{ margin: 0, fontWeight: 600 }}>
          “{created.title}” added — {receivedQty} in stock ✓
        </p>
        <p className="paragraph-small mg-top-8px" style={{ margin: 0 }}>
          {published ? 'Live on the shop.' : 'Hidden — publish it from Products when it’s ready.'}
        </p>
        <div className="mg-top-16px" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button variant="white" onClick={onScanAgain} data-cta-id="admin-create-scan-next">
            Scan next
          </Button>
          <Button
            variant="link"
            onClick={() =>
              onDone(
                published
                  ? `“${created.title}” is live on the shop.`
                  : `“${created.title}” was added — hidden until you publish it.`,
              )
            }
            data-cta-id="admin-create-done"
          >
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div ref={formRef} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="card" style={{ padding: '0.75rem 1rem' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {hint.imageUrl ? (
            <img
              src={hint.imageUrl}
              alt=""
              style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 8 }}
            />
          ) : null}
          <p className="paragraph-small" style={{ margin: 0 }}>
            New barcode: <strong>{initialBarcode}</strong>
            {hintTitle
              ? ` — looks like “${hintTitle}”`
              : ' — nothing found in the barcode database'}
          </p>
        </div>
      </div>

      <form
        className="card checkout-block"
        style={{ padding: '1.25rem' }}
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <h2 className="display-7" style={{ marginTop: 0 }}>
          Create this product
        </h2>
        {created ? (
          <p className="paragraph-small mg-top-8px" style={{ margin: 0, fontWeight: 600 }}>
            Product created — stock not received yet. Retry to finish.
          </p>
        ) : null}
        <div className="mg-top-12px">
          <label htmlFor="admin-new-barcode" style={labelStyle}>
            Barcode
          </label>
          <input
            id="admin-new-barcode"
            style={inputStyle}
            value={barcode}
            inputMode="numeric"
            disabled={Boolean(created) || (draftShots?.length ?? 0) > 0}
            onChange={(e) => setBarcode(e.target.value)}
          />
        </div>
        {needsPhotos ? null : (
          <>
            <div className="mg-top-12px">
              <label htmlFor="admin-new-title" style={labelStyle}>
                Name
              </label>
              <input
                id="admin-new-title"
                style={inputStyle}
                value={title}
                placeholder="e.g. Shea Butter Body Balm"
                disabled={Boolean(created)}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="mg-top-12px">
              <label htmlFor="admin-new-price" style={labelStyle}>
                Price (USD)
              </label>
              <input
                id="admin-new-price"
                style={inputStyle}
                value={price}
                inputMode="decimal"
                placeholder="e.g. 45.00"
                disabled={Boolean(created)}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </>
        )}
        <div className="mg-top-12px">
          <label htmlFor="admin-new-qty" style={labelStyle}>
            Quantity
          </label>
          <input
            id="admin-new-qty"
            style={{ ...inputStyle, width: 120 }}
            value={qty}
            inputMode="numeric"
            disabled={receivedQty !== null}
            onChange={(e) => setQty(e.target.value)}
          />
          <p className="paragraph-small mg-top-8px" style={{ margin: 0, opacity: 0.7 }}>
            Units in hand right now — at least 1.
          </p>
        </div>
        {needsPhotos ? null : (
          <div className="mg-top-12px">
            <label
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}
              htmlFor="admin-new-visibility"
            >
              <input
                id="admin-new-visibility"
                type="checkbox"
                checked={showOnWebsite}
                disabled={published}
                onChange={(e) => setShowOnWebsite(e.target.checked)}
              />
              Show on website
            </label>
            <p className="paragraph-small mg-top-8px" style={{ margin: 0, opacity: 0.7 }}>
              Leave off to review the name, photo, and description first — you can publish from
              Products.
            </p>
          </div>
        )}
        {needsPhotos ? null : (
          <div className="mg-top-12px">
            <label htmlFor="admin-new-category" style={labelStyle}>
              Category
            </label>
            <select
              id="admin-new-category"
              style={inputStyle}
              value={categoryId}
              disabled={Boolean(created)}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            {hint.category ? (
              <p className="paragraph-small mg-top-8px" style={{ margin: 0, opacity: 0.7 }}>
                Database suggests: {hint.category}
              </p>
            ) : null}
            {showNewCategory ? (
              <div className="mg-top-8px" style={{ display: 'flex', gap: 8 }}>
                <input
                  aria-label="New category name"
                  style={inputStyle}
                  value={newCategory}
                  placeholder="e.g. Serums"
                  onChange={(e) => setNewCategory(e.target.value)}
                />
                <Button
                  type="button"
                  variant="white"
                  disabled={newCategory.trim().length < 2 || busy}
                  data-cta-id="admin-create-category"
                  onClick={async () => {
                    setError(null);
                    try {
                      const cat = await createRetailCategory(newCategory.trim());
                      onNewCategory(cat);
                      setCategoryId(cat.id);
                      setNewCategory('');
                      setShowNewCategory(false);
                    } catch (err) {
                      if (isAuthError(err)) {
                        onAuthExpired();
                        return;
                      }
                      setError(
                        err instanceof Error && err.message
                          ? err.message
                          : 'Could not create the category.',
                      );
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            ) : created ? null : (
              <div className="mg-top-8px">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setShowNewCategory(true)}
                  data-cta-id="admin-new-category-toggle"
                >
                  + New category
                </Button>
              </div>
            )}
          </div>
        )}
        {needsPhotos ? null : (
          <div className="mg-top-12px">
            <label htmlFor="admin-new-description" style={labelStyle}>
              Description
            </label>
            <textarea
              id="admin-new-description"
              ref={descriptionRef}
              style={{ ...inputStyle, minHeight: 88, resize: 'none', overflow: 'hidden' }}
              value={description}
              placeholder="Shown on the product page (optional)"
              disabled={Boolean(created)}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        )}
        {needsPhotos ? (
          <div className="mg-top-12px">
            <span style={labelStyle}>Photos</span>
            {(['front', 'back'] as const).map((shot) => {
              const preview = shot === 'front' ? frontPreview : backPreview;
              return (
                <div
                  key={shot}
                  className="mg-top-8px"
                  style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt={shot === 'front' ? 'Front of product' : 'Back of product'}
                      style={{
                        width: 72,
                        height: 72,
                        objectFit: 'cover',
                        borderRadius: 8,
                        flexShrink: 0,
                      }}
                    />
                  ) : null}
                  <p className="paragraph-small" style={{ margin: 0, flexGrow: 1 }}>
                    {shot === 'front' ? 'Front photo' : 'Back photo'}
                  </p>
                  <Button
                    type="button"
                    variant="white"
                    aria-label={`Edit ${shot} photo`}
                    disabled={busy || Boolean(created)}
                    onClick={() => setCapturing(shot)}
                    data-cta-id={`admin-photo-edit-${shot}`}
                  >
                    Edit
                  </Button>
                </div>
              );
            })}
          </div>
        ) : null}
        {needsPhotos ? null : hint.imageUrl ? (
          <p className="paragraph-small mg-top-12px" style={{ margin: 0, opacity: 0.7 }}>
            Photo from the barcode database attached ✓
          </p>
        ) : (
          <p className="paragraph-small mg-top-12px" style={{ margin: 0, opacity: 0.7 }}>
            The shop shows a placeholder tile until product imagery lands.
          </p>
        )}
        {error ? (
          <p role="alert" className="paragraph-small mg-top-12px" style={{ color: '#b91c1c' }}>
            {error}
          </p>
        ) : null}
        <div className="mg-top-16px" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button
            type="submit"
            disabled={
              busy ||
              (!created &&
                (!barcode.trim() ||
                  (needsPhotos
                    ? !shotPresent('front') || !shotPresent('back')
                    : title.trim().length < 2 || !price))) ||
              qtyNum < 1
            }
            data-cta-id="admin-add-product"
          >
            {busy ? 'Working…' : created ? 'Retry' : 'Add product'}
          </Button>
          {created ? null : (
            <Button
              type="button"
              variant="link"
              onClick={onCancel}
              data-cta-id="admin-create-cancel"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
