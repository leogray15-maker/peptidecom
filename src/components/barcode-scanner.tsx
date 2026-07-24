"use client";

import { useEffect, useRef, useState } from "react";
import { Flashlight, Loader2, X } from "lucide-react";
import type { IScannerControls } from "@zxing/browser";

/**
 * Live camera barcode scanner. Uses ZXing (loaded on demand so it never bloats
 * the initial bundle) with a rear-camera constraint, so it works on iOS Safari
 * where the native BarcodeDetector API isn't available. Calls onDetected once
 * with the decoded barcode, then stops the stream.
 */
export function BarcodeScanner({
  onDetected,
  onClose,
}: {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const firedRef = useRef(false);
  const [status, setStatus] = useState<"starting" | "scanning" | "error">("starting");
  const [error, setError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] =
          await Promise.all([import("@zxing/browser"), import("@zxing/library")]);

        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
        ]);

        const reader = new BrowserMultiFormatReader(hints);
        if (cancelled || !videoRef.current) return;

        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } } },
          videoRef.current,
          (result) => {
            if (result && !firedRef.current) {
              firedRef.current = true;
              onDetected(result.getText());
              controlsRef.current?.stop();
            }
          }
        );
        controlsRef.current = controls;
        if (cancelled) {
          controls.stop();
          return;
        }
        setStatus("scanning");

        // Torch support is device-specific — expose it only when available.
        const stream = videoRef.current.srcObject as MediaStream | null;
        const track = stream?.getVideoTracks()[0];
        const caps = track?.getCapabilities?.() as (MediaTrackCapabilities & { torch?: boolean }) | undefined;
        if (caps?.torch) setTorchAvailable(true);
      } catch (e) {
        if (cancelled) return;
        setStatus("error");
        const msg = e instanceof Error ? e.message : "";
        if (/permission|NotAllowed/i.test(msg)) {
          setError("Camera access was blocked. Allow camera in your browser settings, then try again.");
        } else if (/NotFound|Requested device/i.test(msg)) {
          setError("No camera found on this device.");
        } else if (/secure|https/i.test(msg)) {
          setError("The camera needs a secure (https) connection.");
        } else {
          setError("Couldn't start the camera. You can type the barcode instead.");
        }
      }
    }

    void start();
    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleTorch() {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    const track = stream?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      setTorchOn(next);
    } catch {
      setTorchAvailable(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Top bar */}
      <div className="flex items-center justify-between p-4">
        <p className="text-sm font-medium text-white/90">Point at a product barcode</p>
        <button
          onClick={onClose}
          className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          aria-label="Close scanner"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Camera */}
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          playsInline
        />

        {status === "starting" && (
          <div className="absolute inset-0 grid place-items-center">
            <p className="flex items-center gap-2 text-sm text-white/80">
              <Loader2 className="h-4 w-4 animate-spin" /> Starting camera…
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 grid place-items-center p-8">
            <p className="max-w-xs text-center text-sm text-white/80">{error}</p>
          </div>
        )}

        {/* Scan frame — Yuka-style corner brackets */}
        {status === "scanning" && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="relative h-44 w-64">
              {[
                "left-0 top-0 border-l-2 border-t-2 rounded-tl-xl",
                "right-0 top-0 border-r-2 border-t-2 rounded-tr-xl",
                "left-0 bottom-0 border-l-2 border-b-2 rounded-bl-xl",
                "right-0 bottom-0 border-r-2 border-b-2 rounded-br-xl",
              ].map((c) => (
                <span key={c} className={`absolute h-8 w-8 border-brand-400 ${c}`} />
              ))}
              <span className="absolute inset-x-0 top-1/2 h-0.5 animate-pulse bg-brand-400/80" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-center gap-4 p-6">
        {torchAvailable && (
          <button
            onClick={toggleTorch}
            className={`grid h-12 w-12 place-items-center rounded-full transition ${
              torchOn ? "bg-brand-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
            }`}
            aria-label="Toggle torch"
          >
            <Flashlight className="h-5 w-5" />
          </button>
        )}
        <button onClick={onClose} className="rounded-full bg-white/10 px-5 py-3 text-sm font-medium text-white hover:bg-white/20">
          Type it instead
        </button>
      </div>
    </div>
  );
}
