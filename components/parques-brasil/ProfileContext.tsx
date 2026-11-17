import React, { createContext, useContext, useMemo, useState } from 'react';
import { EMPTY_PROFILE, type ParquesProfile } from './profile';

/*
  O perfil escolhido no hero vale para a página inteira: os cards destacam os
  parques que encaixam e todo CTA leva o perfil ao ContactModal. Estado só no
  cliente — o prerender sai sem seleção, igual à primeira pintura.
*/

interface ProfileContextValue {
  profile: ParquesProfile;
  setProfile: (profile: ParquesProfile) => void;
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: EMPTY_PROFILE,
  setProfile: () => undefined,
});

export const ParquesProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<ParquesProfile>(EMPTY_PROFILE);
  const value = useMemo(() => ({ profile, setProfile }), [profile]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export function useParquesProfile(): ProfileContextValue {
  return useContext(ProfileContext);
}
