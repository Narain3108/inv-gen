"""Audit helper utilities for recording action logs to Firestore.

This module exposes `record_audit` which writes a standard audit document
to the top-level `audit_logs` collection. Audit documents are immutable
records describing who performed what action, on which resource, and when.

Design notes:
- Keep the payload small; store actor snapshot (id, username, role).
- `changes` is an optional dict of changed fields: { field: {old:..., new:...} }
"""
from typing import Optional, Dict, Any
from datetime import datetime


def compute_changes(old: Optional[Dict[str, Any]], new: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not old or not new:
        return None
    changes = {}
    for k, v in new.items():
        old_v = old.get(k)
        if old_v != v:
            changes[k] = {"old": old_v, "new": v}
    return changes if changes else None


def record_audit(db, *, company_id: Optional[str], resource_type: str, resource_id: str, action: str, actor: Dict[str, Any], changes: Optional[Dict[str, Any]] = None, meta: Optional[Dict[str, Any]] = None):
    """Write an audit entry into `audit_logs`.

    Args:
        db: Firestore client (from get_firestore_db())
        company_id: company id associated with the action (optional)
        resource_type: e.g. 'invoice', 'quotation', 'client'
        resource_id: id of the resource acted upon
        action: short action name e.g. 'create', 'update', 'delete', 'add_payment'
        actor: dict with keys `id`, `username`, `role`
        changes: optional dict of changed fields
        meta: optional metadata
    """
    audit_ref = db.collection("audit_logs").document()
    payload = {
        "companyId": company_id,
        "resourceType": resource_type,
        "resourceId": resource_id,
        "action": action,
        "timestamp": datetime.utcnow(),
        "actor": {
            "id": actor.get("id"),
            "username": actor.get("username"),
            "role": actor.get("role"),
        },
    }
    if changes:
        payload["changes"] = changes
    if meta:
        payload["meta"] = meta

    audit_ref.set(payload)
    return audit_ref.id
