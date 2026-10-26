/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Única URL base de la API. La API key la inyecta Express, nunca el cliente. */
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
