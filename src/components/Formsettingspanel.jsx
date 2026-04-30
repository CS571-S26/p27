import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { useApp } from "../hooks/AppContext";
import { FORM_TYPES, ALTERNATE_FORMS } from "../utils/pokeapi";

// Confirmation modal shown when turning off a form type that has ranked pokemon
function ConfirmDisableModal({ formType, rankedCount, onConfirm, onCancel }) {
  const ft = FORM_TYPES.find(f => f.id === formType);
  return (
    <Modal show onHide={onCancel} centered className="poke-modal">
      <Modal.Header closeButton closeVariant="white">
        <Modal.Title style={{ fontFamily: "Bangers, cursive", fontSize: "1.6rem" }}>
          Remove {ft?.label}?
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p style={{ color: "#9fa8da" }}>
          You have <strong style={{ color: "white" }}>{rankedCount} {ft?.label}</strong> in
          your tier list or favorites. Turning this off will remove them all.
        </p>
      </Modal.Body>
      <Modal.Footer style={{ borderColor: "rgba(15,52,96,0.8)" }}>
        <Button variant="outline-secondary" onClick={onCancel}>Keep them</Button>
        <Button variant="danger" onClick={onConfirm}>Remove them</Button>
      </Modal.Footer>
    </Modal>
  );
}

// A single toggle row for one form type
function FormTypeToggle({ formType, enabled, onToggle }) {
  const count = ALTERNATE_FORMS.filter(f => f.formType === formType.id).length;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 14px",
      background: enabled ? `${formType.color}14` : "rgba(255,255,255,0.03)",
      border: `1.5px solid ${enabled ? formType.color + "66" : "rgba(42,42,96,0.8)"}`,
      borderRadius: 10,
      transition: "all 0.2s",
      marginBottom: 8,
    }}>
      <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>{formType.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: "0.9rem", color: enabled ? "white" : "#9fa8da" }}>
          {formType.label}
        </div>
        <div style={{ fontSize: "0.72rem", color: "rgba(159,168,218,0.6)" }}>
          {count} forms
        </div>
      </div>
      {/* Toggle switch */}
      <button
        role="switch"
        aria-checked={enabled}
        aria-label={`${enabled ? "Disable" : "Enable"} ${formType.label}`}
        onClick={() => onToggle(formType.id, !enabled)}
        style={{
          width: 44, height: 24,
          borderRadius: 12,
          background: enabled ? formType.color : "rgba(42,42,96,0.8)",
          border: "none",
          cursor: "pointer",
          position: "relative",
          transition: "background 0.2s",
          flexShrink: 0,
        }}
      >
        <span style={{
          position: "absolute",
          top: 3, left: enabled ? 23 : 3,
          width: 18, height: 18,
          borderRadius: "50%",
          background: "white",
          transition: "left 0.2s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
        }} />
      </button>
    </div>
  );
}

// The main panel — can be embedded anywhere (AccountModal, settings page, etc.)
export default function FormSettingsPanel({ compact = false }) {
  const { formSettings, updateFormSetting, tierState, favorites } = useApp();
  const [confirmDisable, setConfirmDisable] = useState(null); // formType id being disabled

  if (!formSettings) return null;

  function handleToggle(formTypeId, enabled) {
    if (!enabled) {
      // Check if any of these forms are currently ranked or favorited
      const affected = new Set(
        ALTERNATE_FORMS.filter(f => f.formType === formTypeId).map(f => f.name)
      );
      const rankedCount = Object.values(tierState || {})
        .flat()
        .filter(id => affected.has(id)).length;
      const favCount = Array.from(favorites || []).filter(id => affected.has(id)).length;
      const total = rankedCount + favCount;

      if (total > 0) {
        setConfirmDisable({ formTypeId, total });
        return;
      }
    }
    updateFormSetting(formTypeId, enabled);
  }

  function confirmAndDisable() {
    updateFormSetting(confirmDisable.formTypeId, false);
    setConfirmDisable(null);
  }

  const anyEnabled = Object.values(formSettings).some(Boolean);

  return (
    <div>
      {!compact && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: "Bangers, cursive", fontSize: "1.4rem", marginBottom: 4 }}>
            Alternate Forms
          </div>
          <p style={{ fontSize: "0.8rem", color: "#9fa8da", margin: 0 }}>
            Include these alongside regular Pokémon in your tier list and favorites.
            Each type adds a curated set of forms to your unranked pool.
          </p>
        </div>
      )}

      {FORM_TYPES.map(ft => (
        <FormTypeToggle
          key={ft.id}
          formType={ft}
          enabled={!!formSettings[ft.id]}
          onToggle={handleToggle}
        />
      ))}

      {anyEnabled && (
        <div style={{
          marginTop: 10, padding: "8px 12px",
          background: "rgba(255,255,255,0.04)",
          borderRadius: 8, fontSize: "0.75rem", color: "rgba(159,168,218,0.6)",
        }}>
          Enabled forms appear in your unranked sidebar. Load them like any Pokémon —
          drag into tiers or tap to favorite. Stats analysis includes them automatically.
        </div>
      )}

      {confirmDisable && (
        <ConfirmDisableModal
          formType={confirmDisable.formTypeId}
          rankedCount={confirmDisable.total}
          onConfirm={confirmAndDisable}
          onCancel={() => setConfirmDisable(null)}
        />
      )}
    </div>
  );
}