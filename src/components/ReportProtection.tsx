import { useEffect, ReactNode } from "react";

interface ReportProtectionProps {
  children: ReactNode;
  isProtected: boolean;
}

export function ReportProtection({ children, isProtected }: ReportProtectionProps) {
  useEffect(() => {
    if (!isProtected) return;

    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Disable keyboard shortcuts for copy, print, screenshot
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl+C, Ctrl+P, Ctrl+S, Print Screen
      if (
        (e.ctrlKey && (e.key === "c" || e.key === "p" || e.key === "s")) ||
        e.key === "PrintScreen"
      ) {
        e.preventDefault();
        return false;
      }

      // Prevent Cmd+C, Cmd+P, Cmd+S on Mac
      if (
        (e.metaKey && (e.key === "c" || e.key === "p" || e.key === "s"))
      ) {
        e.preventDefault();
        return false;
      }
    };

    // Disable copy event
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    // Add blur effect when window loses focus (potential screenshot)
    const handleVisibilityChange = () => {
      const overlay = document.getElementById("protection-overlay");
      if (overlay) {
        overlay.style.display = document.hidden ? "flex" : "none";
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isProtected]);

  if (!isProtected) {
    return <>{children}</>;
  }

  return (
    <div className="relative select-none" style={{ userSelect: "none", WebkitUserSelect: "none" }}>
      {/* Protection overlay when window loses focus */}
      <div
        id="protection-overlay"
        className="fixed inset-0 bg-black/90 z-50 items-center justify-center hidden"
      >
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Content Protected</h2>
          <p className="text-gray-400">Return to view your report</p>
        </div>
      </div>

      {/* Watermark overlay for free tier */}
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <div className="text-6xl font-bold text-gray-900 rotate-[-30deg] whitespace-nowrap">
            PREVIEW ONLY • UPGRADE TO DOWNLOAD
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
