import "./globals.css";
import SmoothScroll from "./components/SmoothScroll";
import CustomCursor from "./components/CustomCursor";

export const metadata = {
  title: "ARCHON — AI Sales Intelligence",
  description: "Five autonomous AI agents that find leads, research companies, write and send personalized outreach at scale.",
  icons: {
    icon: "/archon-logo-a-dot.svg",
    shortcut: "/archon-logo-a-dot.svg",
    apple: "/archon-logo-a-dot.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SmoothScroll>
          <CustomCursor />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}