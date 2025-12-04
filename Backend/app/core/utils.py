from typing import Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def ensure_user_company_access(db, user: Dict[str, Any], company_id: str) -> bool:
    """
    If the user is an admin or employee and the company belongs to the same organization,
    add the company to the user's allowedCompanyIds to avoid access-desyncs.
    Returns True if access granted (already present or newly added), False otherwise.
    """
    try:
        if not company_id:
            return False

        # Super admins always have access
        if user.get('role') == 'super_admin':
            return True

        # Auto-grant for admins and employees (allow employees to be granted company access
        # automatically when the company belongs to the same organization). This helps
        # avoid transient access-denied race conditions during assignment/creation flows.
        if user.get('role') not in ('admin', 'employee'):
            return False

        # Check company exists and belongs to same org
        comp_doc = db.collection('companies').document(company_id).get()
        if not comp_doc.exists:
            return False
        comp_data = comp_doc.to_dict()
        if comp_data.get('organizationId') != user.get('organizationId'):
            return False

        allowed = user.get('allowedCompanyIds', []) or []
        if company_id in allowed:
            return True

        # Add company to user's allowedCompanyIds
        try:
            users_ref = db.collection('users')
            user_doc_ref = users_ref.document(user.get('id'))
            # Read current user's allowed list to avoid race
            cur = user_doc_ref.get()
            if cur.exists:
                cur_data = cur.to_dict()
                cur_allowed = cur_data.get('allowedCompanyIds', []) or []
                if company_id not in cur_allowed:
                    new_allowed = cur_allowed + [company_id]
                    user_doc_ref.update({'allowedCompanyIds': new_allowed, 'updatedAt': datetime.utcnow().isoformat()})
                    logger.info("ensure_user_company_access: added company %s to user %s allowedCompanyIds", company_id, user.get('id'))
                    return True
        except Exception:
            logger.exception("ensure_user_company_access: failed to add company to user")
            return False

    except Exception:
        logger.exception("ensure_user_company_access: unexpected error")
    return False
