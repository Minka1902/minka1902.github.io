import { QRCodeSVG } from 'qrcode.react';

interface Props {
  dogId: string;
  size?: number;
}

export default function QRCodeDisplay({ dogId, size = 260 }: Props) {
  const url = `${window.location.origin}/dog/${dogId}/public`;
  return <QRCodeSVG value={url} size={size} includeMargin />;
}
