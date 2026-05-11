import { useState } from "react";
import { CreditCard, Lock, CheckCircle, FlaskConical } from "lucide-react";
import "./PagoModal.css";

interface Props {
  onClose: () => void;
  onConfirmar: () => void;
  loading: boolean;
}

const formatCardNumber = (value: string) =>
  value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();

const formatExpiry = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
};

const PagoModal = ({ onClose, onConfirmar, loading }: Props) => {
  const [devMode, setDevMode]       = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName]     = useState("");
  const [expiry, setExpiry]         = useState("");
  const [cvv, setCvv]               = useState("");

  const isFormValid = devMode || (
    cardNumber.replace(/\s/g, "").length === 16 &&
    cardName.trim().length > 2 &&
    expiry.length === 5 &&
    cvv.length >= 3
  );

  return (
    <div className="pago-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pago-modal">

        {/* Header */}
        <div className="pago-modal__header">
          <div className="pago-modal__header-icon">
            <CreditCard size={20} />
          </div>
          <div>
            <h3 className="pago-modal__title">Pago de Consulta</h3>
            <p className="pago-modal__subtitle">Ingresa los datos de tu tarjeta</p>
          </div>
          <button className="pago-modal__close" onClick={onClose} aria-label="Cerrar" type="button">
            ×
          </button>
        </div>

        {/* Dev mode toggle */}
        <label className={`pago-devmode ${devMode ? "pago-devmode--active" : ""}`}>
          <FlaskConical size={15} />
          <span>Modo desarrollo - omitir pago</span>
          <div className="pago-devmode__toggle">
            <input
              type="checkbox"
              checked={devMode}
              onChange={(e) => setDevMode(e.target.checked)}
            />
            <span className="pago-devmode__slider" />
          </div>
        </label>

        {/* Card preview */}
        <div className={`pago-card-preview ${devMode ? "pago-card-preview--dev" : ""}`}>
          <div className="pago-card-preview__top">
            <span className="pago-card-preview__bank">Policlínico San José</span>
            <CreditCard size={24} className="pago-card-preview__icon" />
          </div>
          <div className="pago-card-preview__number">
            {devMode
              ? "•••• •••• •••• ••••"
              : (cardNumber || "•••• •••• •••• ••••")}
          </div>
          <div className="pago-card-preview__bottom">
            <div>
              <div className="pago-card-preview__label">Titular</div>
              <div className="pago-card-preview__value">
                {devMode ? "MODO DESARROLLO" : (cardName.toUpperCase() || "NOMBRE APELLIDO")}
              </div>
            </div>
            <div>
              <div className="pago-card-preview__label">Vence</div>
              <div className="pago-card-preview__value">{devMode ? "••/••" : (expiry || "MM/AA")}</div>
            </div>
          </div>
        </div>

        {/* Form fields */}
        <div className={`pago-form ${devMode ? "pago-form--disabled" : ""}`}>
          <div className="pago-form__group">
            <label className="pago-form__label">Número de tarjeta</label>
            <input
              className="pago-form__input"
              type="text"
              inputMode="numeric"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              disabled={devMode}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            />
          </div>
          <div className="pago-form__group">
            <label className="pago-form__label">Nombre del titular</label>
            <input
              className="pago-form__input"
              type="text"
              placeholder="Como aparece en la tarjeta"
              value={cardName}
              disabled={devMode}
              onChange={(e) => setCardName(e.target.value.replace(/[^a-zA-Z\s]/g, "").slice(0, 40))}
            />
          </div>
          <div className="pago-form__row">
            <div className="pago-form__group">
              <label className="pago-form__label">Vencimiento</label>
              <input
                className="pago-form__input"
                type="text"
                inputMode="numeric"
                placeholder="MM/AA"
                value={expiry}
                disabled={devMode}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              />
            </div>
            <div className="pago-form__group">
              <label className="pago-form__label">CVV</label>
              <input
                className="pago-form__input"
                type="text"
                inputMode="numeric"
                placeholder="•••"
                value={cvv}
                disabled={devMode}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
              />
            </div>
          </div>
        </div>

        {/* Amount */}
        <div className="pago-amount">
          <span className="pago-amount__label">Total a pagar</span>
          <span className="pago-amount__value">S/. 50.00</span>
        </div>

        {/* Actions */}
        <div className="pago-modal__actions">
          <button className="pago-btn-cancel" type="button" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button
            className={`pago-btn-pay ${devMode ? "pago-btn-pay--dev" : ""}`}
            type="button"
            disabled={!isFormValid || loading}
            onClick={onConfirmar}
          >
            {loading ? (
              <span className="spinner-small" />
            ) : devMode ? (
              <><CheckCircle size={15} /> Confirmar sin pago</>
            ) : (
              <><Lock size={15} /> Pagar S/. 50.00</>
            )}
          </button>
        </div>

        {!devMode && (
          <p className="pago-modal__security">
            <Lock size={11} /> Pago seguro con encriptación SSL
          </p>
        )}
      </div>
    </div>
  );
};

export default PagoModal;
