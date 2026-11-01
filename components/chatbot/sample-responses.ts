import type { AssistantResponse } from "./types";

export const sampleAssistantResponses: AssistantResponse[] = [
  {
    type: "chart",
    title: "Orders by month",
    chartType: "bar",
    xKey: "month",
    series: [
      { key: "orders", label: "Orders", color: "#2867d8" },
      { key: "returns", label: "Returns", color: "#e57454" },
    ],
    data: [
      { month: "Jan", orders: 42, returns: 4 },
      { month: "Feb", orders: 58, returns: 6 },
      { month: "Mar", orders: 51, returns: 5 },
      { month: "Apr", orders: 76, returns: 7 },
      { month: "May", orders: 68, returns: 4 },
    ],
  },
  {
    type: "table",
    title: "Top selling products",
    columns: ["Product", "Units", "Revenue"],
    rows: [
      { Product: "Desk Lamp", Units: 132, Revenue: 5280 },
      { Product: "Travel Bottle", Units: 214, Revenue: 4280 },
      { Product: "Everyday Mug", Units: 248, Revenue: 3720 },
      { Product: "Canvas Tote", Units: 186, Revenue: 2790 },
      { Product: "Notebook Set", Units: 159, Revenue: 2385 },
    ],
  },
];
