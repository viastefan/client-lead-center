import type { LineItem } from "./types";

export const SERVICE_PRESETS: Array<Omit<LineItem, "id">> = [
  {
    title: "Website-Betreuung",
    description: "Betrieb, kleine Textänderungen und technische Aufsicht.",
    qty: 1,
    unit: "Monat",
    unitPrice: 190,
  },
  {
    title: "Einrichtung / Relaunch",
    description: "Aufsetzen, Formulare, Domain und Übergabe.",
    qty: 1,
    unit: "Pauschale",
    unitPrice: 890,
  },
  {
    title: "Änderungen",
    description: "Inhaltliche oder visuelle Anpassungen nach Briefing.",
    qty: 1,
    unit: "Paket",
    unitPrice: 120,
  },
  {
    title: "Hosting-Koordination",
    description: "Domain, DNS und Weiterleitungen.",
    qty: 1,
    unit: "Pauschale",
    unitPrice: 90,
  },
];
