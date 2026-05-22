import React, { useSyncExternalStore } from 'react';

interface ClientOnlyProps {
  children: React.ReactNode;
}

const subscribe = () => () => {};

export const ClientOnly: React.FC<ClientOnlyProps> = ({ children }) => {
  const isMounted = useSyncExternalStore(subscribe, () => true, () => false);

  if (!isMounted) {
    return null;
  }

  return <>{children}</>;
};
