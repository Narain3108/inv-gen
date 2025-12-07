'use client';

import React from 'react';

interface Props {
  item: any;
}

export default function AuditItem({ item }: Props) {
  const ts = item?.timestamp ? new Date(item.timestamp).toLocaleString() : '';
  const actor = item?.actor || {};
  const meta = item?.meta;
  const changes = item?.changes;

  return (
    <div className="border rounded p-3 bg-white shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm text-gray-600">{ts}</div>
          <div className="text-base font-medium">{item.resourceType} • {item.action}</div>
          <div className="text-sm text-gray-700">Resource: {item.resourceId}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">{actor.username || actor.id}</div>
          <div className="text-xs text-gray-500">{actor.role}</div>
        </div>
      </div>

      {meta && (
        <div className="mt-2 text-sm text-gray-700">
          <strong className="mr-2">Meta:</strong>
          <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded">{JSON.stringify(meta)}</pre>
        </div>
      )}

      {changes && (
        <div className="mt-2 text-sm text-gray-700">
          <strong className="mr-2">Changes:</strong>
          <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded">{JSON.stringify(changes)}</pre>
        </div>
      )}
    </div>
  );
}
