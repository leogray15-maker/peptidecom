export interface ChatChannel {
  id: string;
  name: string;
  description: string;
}

export const CHAT_CHANNELS: ChatChannel[] = [
  { id: "general", name: "General", description: "Everything and anything." },
  { id: "glp1", name: "GLP-1s", description: "Sema, Tirz, Reta." },
  { id: "vendors", name: "Vendors", description: "Live vendor chatter." },
  { id: "protocols", name: "Protocols", description: "Dosing & research talk." },
  { id: "group-buys", name: "Group buys", description: "Coordinate in real time." },
];
