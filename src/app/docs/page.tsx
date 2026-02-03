"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500 mx-auto mb-4" />
        <p className="text-gray-400">Carregando documentação...</p>
      </div>
    </div>
  ),
});

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <style jsx global>{`
        /* Swagger UI Dark Theme Customizations */
        .swagger-ui {
          font-family: system-ui, -apple-system, sans-serif;
        }

        .swagger-ui .topbar {
          display: none;
        }

        .swagger-ui .info {
          margin: 30px 0;
        }

        .swagger-ui .info .title {
          font-size: 2.5rem;
          font-weight: 700;
        }

        .swagger-ui .info .description {
          font-size: 1rem;
          line-height: 1.6;
        }

        .swagger-ui .opblock-tag {
          font-size: 1.25rem;
          font-weight: 600;
          border-bottom: 1px solid #e2e8f0;
        }

        .swagger-ui .opblock {
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-bottom: 8px;
        }

        .swagger-ui .opblock .opblock-summary {
          padding: 12px 16px;
        }

        .swagger-ui .opblock.opblock-get {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.05);
        }

        .swagger-ui .opblock.opblock-get .opblock-summary-method {
          background: #10b981;
        }

        .swagger-ui .opblock.opblock-post {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.05);
        }

        .swagger-ui .opblock.opblock-post .opblock-summary-method {
          background: #3b82f6;
        }

        .swagger-ui .opblock.opblock-put {
          border-color: #f59e0b;
          background: rgba(245, 158, 11, 0.05);
        }

        .swagger-ui .opblock.opblock-put .opblock-summary-method {
          background: #f59e0b;
        }

        .swagger-ui .opblock.opblock-patch {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.05);
        }

        .swagger-ui .opblock.opblock-patch .opblock-summary-method {
          background: #8b5cf6;
        }

        .swagger-ui .opblock.opblock-delete {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.05);
        }

        .swagger-ui .opblock.opblock-delete .opblock-summary-method {
          background: #ef4444;
        }

        .swagger-ui .btn.execute {
          background: #8b5cf6;
          border-color: #8b5cf6;
        }

        .swagger-ui .btn.execute:hover {
          background: #7c3aed;
        }

        .swagger-ui .model-box {
          background: #f8fafc;
          border-radius: 8px;
        }

        .swagger-ui section.models {
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .swagger-ui section.models h4 {
          font-size: 1.25rem;
          font-weight: 600;
        }

        /* Back to app link */
        .back-link {
          position: fixed;
          top: 16px;
          left: 16px;
          z-index: 1000;
          background: #8b5cf6;
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 500;
          text-decoration: none;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
          transition: all 0.2s;
        }

        .back-link:hover {
          background: #7c3aed;
          transform: translateY(-1px);
        }
      `}</style>

      <a href="/" className="back-link">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Voltar ao App
      </a>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <SwaggerUI
          url="/api/docs"
          docExpansion="list"
          defaultModelsExpandDepth={-1}
          displayRequestDuration
          filter
          showExtensions
          showCommonExtensions
          tryItOutEnabled={false}
        />
      </div>
    </div>
  );
}
