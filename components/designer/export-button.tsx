'use client';

import React, { useState } from 'react';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface ExportButtonProps {
  targetRef: React.RefObject<HTMLDivElement | null>;
  headline: string;
}

export function ExportButton({ targetRef, headline }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleDownload = async () => {
    if (!targetRef.current) return;

    setExporting(true);

    try {
      // 1. Wait for all web fonts to load
      if (document.fonts) {
        await document.fonts.ready;
      }

      // Clone or unscale node for export
      const node = targetRef.current;
      const originalTransform = node.style.transform;
      node.style.transform = 'none';

      // 2. Generate PNG with html-to-image
      const dataUrl = await toPng(node, {
        quality: 1.0,
        pixelRatio: 1, // Exact dimensions (1080x1350 or 1080x1080)
        cacheBust: true,
      });

      // Restore scale
      node.style.transform = originalTransform;

      // 3. Trigger Download
      const link = document.createElement('a');
      const filename = `${headline.slice(0, 30).replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_')}_newsdesk.png`;
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (err: unknown) {
      alert('Failed to export post image. Try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      variant="primary"
      onClick={handleDownload}
      loading={exporting}
      leadingIcon={<Download className="w-4 h-4" />}
      className="w-full"
    >
      Download PNG
    </Button>
  );
}

