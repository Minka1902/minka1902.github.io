import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { Alert } from '@/types';

interface Props { alert: Alert }

const SEVERITY_STYLES = {
  critical: 'border-l-destructive text-destructive',
  warning:  'border-l-amber-500 text-amber-700 dark:text-amber-400',
  info:     'border-l-blue-500 text-blue-700 dark:text-blue-400',
};

export default function AlertItem({ alert }: Props) {
  const content = (
    <div className={cn('border-l-4 pl-3 py-1 text-sm', SEVERITY_STYLES[alert.severity])}>
      {alert.message}
    </div>
  );

  if (alert.actionRoute) {
    return <Link to={alert.actionRoute}>{content}</Link>;
  }
  return content;
}
