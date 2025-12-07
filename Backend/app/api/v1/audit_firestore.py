"""
Audit logs read API
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Dict, Any
from app.core.firebase import get_firestore_db
from app.core.deps import get_current_user
from app.core.constants import Roles
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


def serialize_firestore_doc(doc_dict: Dict[str, Any]) -> Dict[str, Any]:
    result = {}
    for key, value in doc_dict.items():
        if hasattr(value, 'isoformat'):
            result[key] = value.isoformat()
        elif isinstance(value, dict):
            result[key] = serialize_firestore_doc(value)
        elif isinstance(value, list):
            result[key] = [serialize_firestore_doc(item) if isinstance(item, dict) else item for item in value]
        else:
            result[key] = value
    return result


@router.get('', response_model=List[Dict[str, Any]])
async def get_audit_logs(
    company_id: Optional[str] = Query(None, alias='company_id'),
    user: Dict = Depends(get_current_user)
):
    """Fetch audit logs. Super admins can fetch all; admins can fetch for their allowed companies; employees are forbidden."""
    try:
        db = get_firestore_db()

        # Permission checks
        if user.get('role') == Roles.EMPLOYEE:
            raise HTTPException(status_code=403, detail='Employees cannot view audit logs')

        query = db.collection('audit_logs')

        # If company_id provided, verify access
        if company_id:
            if user.get('role') != Roles.SUPER_ADMIN and company_id not in (user.get('allowedCompanyIds') or []):
                raise HTTPException(status_code=403, detail='Access denied to this company')
            query = query.where('companyId', '==', company_id)
        else:
            # No company specified: super_admin -> all, admin -> only allowed companies
            if user.get('role') != Roles.SUPER_ADMIN:
                allowed = user.get('allowedCompanyIds') or []
                if not allowed:
                    return []
                # Firestore 'in' supports up to 10 values
                query = query.where('companyId', 'in', allowed[:10])

        # Order by timestamp desc
        query = query.order_by('timestamp', direction='DESC')

        docs = query.stream()
        results = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            results.append(serialize_firestore_doc(data))

        return results

    except HTTPException:
        raise
    except Exception as e:
        logger.exception('Error fetching audit logs')
        raise HTTPException(status_code=500, detail=f'Error fetching audit logs: {str(e)}')
