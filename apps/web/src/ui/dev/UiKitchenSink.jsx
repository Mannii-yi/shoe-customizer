/** UiKitchenSink: shows every UI kit component in every state. Dev D registers it at /dev/ui (dev builds only). */
import { useState } from 'react';
import { Button, IconButton, Card, Badge, Swatch, Input, Select, Modal, useToast, Tooltip, Skeleton, Spinner, Container, SectionTitle, PriceTag, Drawer, ProductCard } from '../index.js';
const Row = ({ t, children }) => <section className="mb-10"><h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted">{t}</h3><div className="flex flex-wrap items-center gap-4">{children}</div></section>;
export default function UiKitchenSink() {
  const [open, setOpen] = useState(false); const [dr, setDr] = useState(false); const [sw, setSw] = useState('sky'); const toast = useToast();
  const colors = { sky: '#5BA4E6', crimson: '#B3202A', forest: '#2F5D3A', gold: '#D4AF37' };
  return (
    <Container size="xl" className="py-24">
      <SectionTitle eyebrow="Dev B" title="UI *kit*" subtitle="Every component, every state." />
      <div className="mt-10">
        <Row t="Button"><Button>Primary</Button><Button variant="accent">Accent</Button><Button variant="outline">Outline</Button><Button variant="ghost">Ghost</Button><Button loading>Loading</Button><Button disabled>Disabled</Button><Button size="sm">Small</Button><Button size="lg">Large</Button></Row>
        <Row t="IconButton"><IconButton label="Previous">‹</IconButton><IconButton label="Next" variant="light">›</IconButton></Row>
        <Row t="Badge"><Badge>Lime</Badge><Badge tone="ink">Ink</Badge><Badge tone="coral">Coral</Badge><Badge tone="blue">Blue</Badge><Badge tone="neutral">Neutral</Badge></Row>
        <Row t="Swatch">{Object.entries(colors).map(([k, hex]) => <Swatch key={k} color={hex} label={k} selected={sw === k} priceDeltaInr={k === 'gold' ? 150 : 0} onClick={() => setSw(k)} />)}</Row>
        <Row t="PriceTag"><PriceTag amountInr={5999} prefix="from" /><PriceTag amountInr={150} delta size="sm" /><PriceTag amountInr={8041} strikeInr={9999} size="lg" /></Row>
        <Row t="Input / Select"><Input label="Email" hint="We never share it" placeholder="you@example.com" /><Input label="Pincode" error="Must be 6 digits" defaultValue="12" /><Select label="Size" placeholder="Pick size" options={[36, 37, 38].map((n) => ({ value: n, label: `EU ${n}` }))} /></Row>
        <Row t="Card"><Card className="w-48">Plain</Card><Card variant="tinted" tint="#a9d8ee" className="w-48">Tinted</Card><Card variant="glass" className="w-48">Glass</Card><Card interactive selected tabIndex={0} className="w-48">Selected</Card></Row>
        <Row t="Feedback"><Spinner /><Skeleton width={160} height={20} /><Tooltip label="Helpful hint"><Button variant="outline">Hover or focus me</Button></Tooltip>
          <Button onClick={() => toast.show({ type: 'success', title: 'Saved', message: 'Design saved.' })}>Toast</Button><Button variant="accent" onClick={() => setOpen(true)}>Modal</Button></Row>
      </div>
        <Row t="ProductCard / Drawer"><ProductCard selected index={0} shoe={{ name: 'Signature', colour: 'Sky', swatch: '#5BA4E6', tint: '#a9d8ee', fromPriceInr: 5999, tag: 'Customizable', customizable: true }} action={{ label: '✦ Customize', onClick: () => setDr(true) }} /><ProductCard index={1} shoe={{ name: 'Beach', colour: 'Blush Pink', swatch: '#f3c6d6', tint: '#f5bfd4', fromPriceInr: 6499, tag: 'Bestseller' }} /></Row>
      <Drawer open={dr} onClose={() => setDr(false)} title="Customize"><p className="text-muted">Drawer content.</p></Drawer>
      <Modal open={open} onClose={() => setOpen(false)} title="Save design" footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => setOpen(false)}>Save</Button></>}><Input label="Design name" /></Modal>
    </Container>
  );
}
