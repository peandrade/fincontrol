"use client";

import { Github, Linkedin } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="border-t transition-colors duration-300 hidden md:block"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--border-color)",
      }}
    >
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {}
          <p
            className="text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Feito por{" "}
            <span
              className="font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              Pedro Andrade
            </span>{" "}
            &copy; {currentYear}
          </p>

          {}
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/peandrade"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg transition-all hover:scale-110"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-primary)";
                e.currentTarget.style.backgroundColor = "var(--bg-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-muted)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="https://www.linkedin.com/in/pedro-andrade-santos/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg transition-all hover:scale-110"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#0A66C2";
                e.currentTarget.style.backgroundColor = "var(--bg-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-muted)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
