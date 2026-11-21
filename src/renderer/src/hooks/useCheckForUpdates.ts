import { useCallback } from 'react';

export interface ReleaseAsset {
  name: string;
  browserDownloadUrl: string;
  size: number;
}

export interface UpdateInfo {
  latestVersion: string;
  releasePageUrl: string;
  releaseBody: string;
  releaseAssets: ReleaseAsset[];
}

export const useCheckForUpdates = () => {
  const checkForUpdates = useCallback(
    async (_currentVersion: string | null): Promise<UpdateInfo | null> => {
      // Updates stay disabled until this project has its own release feed and signing key.
      return null;
    },
    [],
  );

  return checkForUpdates;
};
