import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { legalDocumentsContent } from "./config/legalDocumentsContent";
import Image from "./assets/ImageLogIn.jpeg";
import "./styles/LegalDocumentsView.css";

const DOC_TYPES = {
  terms: "terms",
  dataPolicy: "dataPolicy"
};

function LegalDocumentsView() {
  const [selectedDoc, setSelectedDoc] = useState(DOC_TYPES.terms);

  const activeDocument = useMemo(
    () => legalDocumentsContent[selectedDoc],
    [selectedDoc]
  );

  const currentLabel = selectedDoc === DOC_TYPES.terms ? "Términos y Condiciones" : "Política de Tratamiento de Datos";

  return (
    <main
      className="legal-view"
      style={{
        backgroundImage: `linear-gradient(rgba(20, 7, 28, 0.45), rgba(20, 7, 28, 0.45)), url(${Image})`
      }}
    >
      <div className="legal-view__ambient" aria-hidden="true" />

      <section className="legal-view__card" aria-label="Documentos legales">
        <header className="legal-view__header legal-view__header--desktop">
          <p className="legal-view__eyebrow">Informacion legal</p>
          <p className="legal-view__current">{currentLabel}</p>
          <nav className="legal-view__tabs" aria-label="Seleccion de documento">
            <button
              type="button"
              aria-label="Terminos y Condiciones"
              className={`legal-view__tab ${selectedDoc === DOC_TYPES.terms ? "is-active" : ""}`}
              onClick={() => setSelectedDoc(DOC_TYPES.terms)}
            >
              Terminos y Condiciones
            </button>
            <button
              type="button"
              aria-label="Politica de Tratamiento de Datos"
              className={`legal-view__tab ${selectedDoc === DOC_TYPES.dataPolicy ? "is-active" : ""}`}
              onClick={() => setSelectedDoc(DOC_TYPES.dataPolicy)}
            >
              Politica de datos
            </button>
          </nav>
        </header>

        <header className="legal-view__header legal-view__header--mobile">
          <div className="legal-view__mobile-top">
            <p className="legal-view__eyebrow">Informacion legal</p>
            <p className="legal-view__current">Terminos y Politica</p>
          </div>
        </header>

        <article className="legal-view__content legal-view__content--desktop" aria-live="polite">
          {activeDocument.sections.map((section) => (
            <section key={section.heading} className="legal-view__section">
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
        </article>

        <article className="legal-view__content legal-view__content--mobile" aria-live="polite">
          <section className="legal-view__block-title">
            <h2>{legalDocumentsContent.terms.title}</h2>
          </section>
          {legalDocumentsContent.terms.sections.map((section) => (
            <section key={`mobile-terms-${section.heading}`} className="legal-view__section">
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={`mobile-terms-${section.heading}-${paragraph}`}>{paragraph}</p>
              ))}
            </section>
          ))}

          <section className="legal-view__block-title">
            <h2>{legalDocumentsContent.dataPolicy.title}</h2>
          </section>
          {legalDocumentsContent.dataPolicy.sections.map((section) => (
            <section key={`mobile-policy-${section.heading}`} className="legal-view__section">
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={`mobile-policy-${section.heading}-${paragraph}`}>{paragraph}</p>
              ))}
            </section>
          ))}
        </article>

        <footer className="legal-view__footer">
          <p>
            Documento oficial de referencia para consulta de condiciones de uso y tratamiento de datos del sistema Horarios UPB.
          </p>
          <Link className="legal-view__back" to="/">
            Volver al inicio de sesion
          </Link>
        </footer>
      </section>
    </main>
  );
}

export default LegalDocumentsView;
