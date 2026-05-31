import type { Property } from '../hooks/useProperties';
import type { AnalysisReport } from './reportDerivation';

export const exportPropertyAsPdf = async (property: Property, report: AnalysisReport): Promise<void> => {
  const res = await fetch('/api/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ property, report }),
  });
  if (!res.ok) throw new Error('Export request failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `appraisiq-${property.name.replace(/\s+/g, '-').toLowerCase()}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
