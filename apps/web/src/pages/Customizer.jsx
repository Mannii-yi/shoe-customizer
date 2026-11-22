import { useEffect, useState } from 'react';

import { ShoeScene } from '../three/ShoeScene';
import { useShoeStore } from '../store/shoeStore';
import { useQuote } from '../features/catalog/hooks/useQuote';

import catalogSeed from '../../../../contracts/catalog.seed.json';
import Button from '../ui/Button';
import Swatch from '../ui/Swatch';
import PriceTag from '../ui/PriceTag';

export default function Customizer() {
  const catalog = useShoeStore((s) => s.catalog);
  const configuration = useShoeStore((s) => s.configuration);
  const selectedPartKey = useShoeStore((s) => s.selectedPartKey);
  const explode = useShoeStore((s) => s.explode);

  const setCatalog = useShoeStore((s) => s.setCatalog);
  const setPartOption = useShoeStore((s) => s.setPartOption);
  const selectPart = useShoeStore((s) => s.selectPart);
  const resetConfiguration = useShoeStore((s) => s.resetConfiguration);
  const tweenExplode = useShoeStore((s) => s.tweenExplode);
  const setExplode = useShoeStore((s) => s.setExplode);
  const setCameraPreset = useShoeStore((s) => s.setCameraPreset);
  const setAutoRotate = useShoeStore((s) => s.setAutoRotate);

  const {
  mutate: requestQuote,
  reset: resetQuote,
  data: quoteData,
  isPending: quoteIsPending,
  isError: quoteIsError,
  } = useQuote();

  const [activeTab, setActiveTab] = useState('colors');

  // Load catalog even when the user opens /customize directly.
  useEffect(() => {
    if (!catalog) {
      setCatalog(catalogSeed);
    }

    setCameraPreset('hero');
    setAutoRotate(false);
    setExplode(0);

    return () => {
      setExplode(0);
      setCameraPreset('hero');
    };
  }, [catalog, setCatalog, setCameraPreset, setAutoRotate, setExplode]);
  // Select the first part by default.
  useEffect(() => {
    if (catalog && !selectedPartKey) {
      selectPart(catalog.parts[0]?.key ?? null);
    }
  }, [catalog, selectedPartKey, selectPart]);

  // Request the price from the backend whenever configuration changes.
  // The frontend never calculates the final price itself.
  useEffect(() => {
  if (!catalog || !Object.keys(configuration.parts).length) return;

  const timer = setTimeout(() => {
    requestQuote({
      modelId: catalog.model.id,
      configuration,
    });
  }, 500);

  return () => clearTimeout(timer);
  }, [catalog, configuration, requestQuote]);

  const selectedPart = catalog?.parts.find(
    (part) => part.key === selectedPartKey
  );

  const currentPartConfig = configuration.parts[selectedPartKey] ?? {};

  const priceResponse = quoteData?.totalInr != null
  ? quoteData
  : quoteData?.data;

  const totalPrice = priceResponse?.totalInr;

  if (!catalog) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading shoe catalog...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper px-4 py-8 md:px-8">

      {/* HEADER */}
      <div className="mx-auto mb-8 max-w-7xl">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue">
          Design your own
        </p>

        <h1 className="mt-2 text-4xl font-black text-ink md:text-5xl">
          CUSTOMIZE YOUR RUNNER
        </h1>

        <p className="mt-2 text-sm text-ink/60">
          Make every detail yours.
        </p>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.3fr_0.7fr]">

        {/* LEFT: 3D VIEWER */}
        <section className="overflow-hidden rounded-3xl border border-black/10 bg-white">

          <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
            <div>
              <p className="font-bold text-ink">3D Preview</p>
              <p className="text-xs text-ink/50">
                Drag to rotate · Scroll to zoom
              </p>
            </div>

            <span className="rounded-full bg-lime px-3 py-1 text-xs font-bold">
              RUNNER 01
            </span>
          </div>

          <div className="relative h-[380px] bg-[#F5F3ED] md:h-[520px]">
            <ShoeScene variant="configurator" />
          </div>

          <div className="flex flex-wrap gap-2 border-t border-black/10 p-4">

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                tweenExplode(explode > 0.5 ? 0 : 1);
              }}
            >
              {explode > 0.5 ? 'Assemble shoe' : 'Explode shoe'}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setCameraPreset('hero')}
            >
              Front view
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setCameraPreset('side')}
            >
              Side view
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setCameraPreset('top')}
            >
              Top view
            </Button>

          </div>
        </section>

        {/* RIGHT: CUSTOMIZATION PANEL */}
        <section className="rounded-3xl border border-black/10 bg-white p-5 md:p-6">

          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue">
                Configuration
              </p>

              <h2 className="mt-1 text-2xl font-black text-ink">
                Your Shoe
              </h2>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                resetConfiguration();
                resetQuote();
              }}
            >
              Reset
            </Button>
          </div>

          {/* PART SELECTOR */}
          <p className="mb-3 text-sm font-bold text-ink">
            1. Select a shoe part
          </p>

          <div className="grid grid-cols-2 gap-2">
            {catalog.parts.map((part) => (
              <button
                key={part.key}
                type="button"
                onClick={() => selectPart(part.key)}
                className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold transition ${
                  selectedPartKey === part.key
                    ? 'border-ink bg-ink text-white'
                    : 'border-black/10 bg-white text-ink hover:border-ink'
                }`}
              >
                {part.label}
              </button>
            ))}
          </div>

          {selectedPart && (
            <>
              {/* SELECTED PART */}
              <div className="mt-7 border-t border-black/10 pt-5">

                <p className="text-xs font-bold uppercase tracking-widest text-blue">
                  Selected part
                </p>

                <h3 className="mt-1 text-xl font-black text-ink">
                  {selectedPart.label}
                </h3>

                {/* TABS */}
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('colors')}
                    className={`flex-1 rounded-full py-3 text-sm font-bold ${
                      activeTab === 'colors'
                        ? 'bg-ink text-white'
                        : 'bg-paper text-ink'
                    }`}
                  >
                    Colors
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('materials')}
                    className={`flex-1 rounded-full py-3 text-sm font-bold ${
                      activeTab === 'materials'
                        ? 'bg-ink text-white'
                        : 'bg-paper text-ink'
                    }`}
                  >
                    Materials
                  </button>
                </div>

                {/* COLORS */}
                {activeTab === 'colors' && (
                  <div className="mt-5">
                    <p className="mb-3 text-sm font-semibold text-ink">
                      Choose a colour
                    </p>

                    <div className="grid grid-cols-4 gap-4">
                      {selectedPart.options.colors.map((color) => (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() =>
                            setPartOption(selectedPart.key, {
                              colorId: color.id,
                            })
                          }
                          className="flex flex-col items-center gap-2"
                        >
                          <Swatch
                            color={color.hex}
                            label={color.label}
                            selected={
                              currentPartConfig.colorId === color.id
                            }
                            size={38}
                          />

                          <span className="text-center text-[11px] text-ink/70">
                            {color.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* MATERIALS */}
                {activeTab === 'materials' && (
                  <div className="mt-5">
                    <p className="mb-3 text-sm font-semibold text-ink">
                      Choose a material
                    </p>

                    <div className="space-y-2">
                      {selectedPart.options.materials.map((material) => (
                        <button
                          key={material.id}
                          type="button"
                          onClick={() =>
                            setPartOption(selectedPart.key, {
                              materialId: material.id,
                            })
                          }
                          className={`flex w-full items-center justify-between rounded-xl border p-3 text-sm ${
                            currentPartConfig.materialId === material.id
                              ? 'border-ink bg-paper font-bold'
                              : 'border-black/10'
                          }`}
                        >
                          <span>{material.label}</span>

                          <span className="text-xs text-ink/60">
                            {material.priceDeltaInr > 0
                              ? `+₹${material.priceDeltaInr}`
                              : 'Standard'}
                          </span>
                        </button>
                      ))}
                    </div>

                    <p className="mt-3 text-xs text-ink/50">
                      Material selection is saved in your configuration.
                      Visual material finishes are not yet mapped to the 3D model.
                    </p>
                  </div>
                )}

              </div>
            </>
          )}

          {/* PRICE */}
          <div className="mt-7 border-t border-black/10 pt-5">

            <p className="text-xs font-bold uppercase tracking-widest text-blue">
              Your price
            </p>

            {quoteIsPending && (
              <p className="mt-2 text-sm text-ink/60">
                Getting latest price...
              </p>
            )}

            {typeof totalPrice === 'number' && (
              <div className="mt-2">
                <PriceTag amountInr={totalPrice} size="lg" />
              </div>
            )}

            {	quoteIsError && (
              <p className="mt-2 text-sm text-red-600">
                Live price unavailable. Please check whether the backend
                server is running.
              </p>
            )}

            {!quoteIsPending && !	quoteIsError && totalPrice == null && (
              <p className="mt-2 text-sm text-ink/50">
                Waiting for price quote...
              </p>
            )}

          </div>

        </section>
      </div>
    </div>
  );
}