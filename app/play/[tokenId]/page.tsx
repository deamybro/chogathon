import React, { Suspense } from 'react';
import PlayClient from './PlayClient';
import { defaultChogProvider } from '@/lib/chogProvider';

interface PageProps {
  params: Promise<{ tokenId: string }>;
}

export function generateStaticParams() {
  return [
    { tokenId: '969' },
    { tokenId: '404' },
    { tokenId: '77' },
    { tokenId: '1337' },
    { tokenId: '42' },
    { tokenId: '1969' },
  ];
}

async function PlayCartridgeContent({ params }: PageProps) {
  const resolvedParams = await params;
  const tokenIdNum = parseInt(resolvedParams.tokenId, 10);
  const isValidToken = !isNaN(tokenIdNum) && tokenIdNum > 0;

  const initialChog = isValidToken
    ? await defaultChogProvider.getChog(tokenIdNum)
    : null;

  return (
    <PlayClient
      initialTokenId={isValidToken ? tokenIdNum : 969}
      initialChog={initialChog}
      isInvalidToken={!isValidToken}
    />
  );
}

export default function PlayPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 w-full items-center justify-center font-mono text-xs text-emerald-400">
          <span className="animate-pulse">PLUGGING IN CARTRIDGE...</span>
        </div>
      }
    >
      <PlayCartridgeContent {...props} />
    </Suspense>
  );
}
